import { AuditedStaffMember } from '../domain/model/audited-staff-member.entity';
import { DestroyRef, Injectable, WritableSignal, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, Subscription as Request, firstValueFrom, forkJoin, from, map, mergeMap, takeUntil, toArray } from 'rxjs';
import { RaApi } from '../infrastructure/ra-api';
import { IamStore } from '../../iam/application/iam.store';
import { EnvironmentPreference } from '../../shared/infrastructure/environment-preference';

import { KpiDashboard } from '../domain/model/kpi-dashboard.entity';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { AuditLogEntry } from '../domain/model/audit-log-entry.entity';
import { IndicatorPeriod, lastDays } from '../domain/model/indicator-period';
import { OverviewLaboratory } from '../domain/model/overview-laboratory.entity';
import { OverviewEnvironment } from '../domain/model/overview-environment.entity';
import { OverviewEquipment } from '../domain/model/overview-equipment.entity';
import { OverviewBatch } from '../domain/model/overview-batch.entity';
import { OverviewRawMaterial } from '../domain/model/overview-raw-material.entity';
import { OverviewAlert } from '../domain/model/overview-alert.entity';
import { OverviewReading } from '../domain/model/overview-reading.entity';
import { OverviewSubscription } from '../domain/model/overview-subscription.entity';
import { OverviewPlan } from '../domain/model/overview-plan.entity';
import { ReportOrder } from '../domain/model/report-order';
import { OverviewEnvironmentalProfile } from '../domain/model/overview-environmental-profile.entity';

/** State of one part of the operational overview: what is being read and what was read. */
type OverviewState<T> = { status: 'idle' | 'loading' | 'ready' | 'error'; data: T | null };

const overviewState = <T>() => signal<OverviewState<T>>({ status: 'idle', data: null });

/** Readings charted by the operational overview, from the last hours of a device. */
const OVERVIEW_READINGS = 48;

/** Concurrent requests when the overview reads every environment of the laboratory. */
const ENVIRONMENT_REQUESTS = 4;

/**
 * Application store for managing Reporting and Analysis (RA) state.
 *
 * @remarks
 * This store acts as the central state manager for the Reporting and Analysis
 * bounded context. It uses Angular Signals to expose reactive state to the
 * presentation layer and coordinates all data access through {@link RaApi}.
 *
 * It manages:
 * - The operational overview of the laboratory (dashboard): equipment, batches, low stock, open alerts, the
 *   readings of a device and the subscription. Every part loads and fails on its own.
 * - Indicators of the laboratory for a period (US93)
 * - Deviation indicators of an environment (US94)
 * - Audit log entries
 * - Report generation and file downloads (US95–US98)
 */
@Injectable({ providedIn: 'root' })
export class RaStore {
  /**
   * Infrastructure API facade for Reporting and Analysis operations.
   */
  private readonly api = inject(RaApi);
  private readonly iam = inject(IamStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadDashboard = new Subject<void>();
  private readonly reloadTrends = new Subject<void>();
  private readonly reloadAudit = new Subject<void>();
  private readonly reloadStaffActivity = new Subject<void>();
  private readonly _staffActivity = signal<AuditLogEntry[]>([]);
  private readonly _auditedStaffMember = signal<AuditedStaffMember | null>(null);
  private readonly _staffActivityLoading = signal(false);
  private readonly _staffActivityError = signal<string | null>(null);
  private readonly _profiles = signal<Record<number, OverviewEnvironmentalProfile | null>>({});
  /** Devices whose profile was already asked for, so that it is requested once. */
  private readonly requestedProfiles = new Set<number>();

  /** Activity of the selected staff member, newest first. */
  readonly staffActivity = this._staffActivity.asReadonly();
  /** Identity read through the Laboratory ACL. */
  readonly auditedStaffMember = this._auditedStaffMember.asReadonly();
  readonly staffActivityLoading = this._staffActivityLoading.asReadonly();
  readonly staffActivityError = this._staffActivityError.asReadonly();
  /** Environmental profile by device; null if it does not exist, and no entry until it has been read. */
  readonly profiles = this._profiles.asReadonly();

  /** Cancels the previous request and releases state when the activity route changes or is left. */
  clearStaffActivity(): void {
    this.reloadStaffActivity.next();
    this._staffActivity.set([]);
    this._auditedStaffMember.set(null);
    this._staffActivityLoading.set(false);
    this._staffActivityError.set(null);
  }

  /** Loads a staff identity and its audit entries without sharing models with Laboratory. */
  loadStaffActivity(staffId: number): void {
    this.clearStaffActivity();
    if (!Number.isSafeInteger(staffId) || staffId <= 0) {
      this._staffActivityError.set('staff.detail.load-error');
      return;
    }
    this._staffActivityLoading.set(true);
    const laboratoryId = this.iam.requireLaboratoryId();
    forkJoin({
      member: this.api.getAuditedStaffMember(laboratoryId, staffId),
      activity: this.api.getStaffActivity(laboratoryId, staffId),
    }).pipe(takeUntil(this.reloadStaffActivity), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ member, activity }) => {
        this._auditedStaffMember.set(member);
        this._staffActivity.set([...activity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
        this._staffActivityLoading.set(false);
      },
      error: () => {
        this._staffActivityError.set('staff.detail.load-error');
        this._staffActivityLoading.set(false);
      },
    });
  }

  /**
   * Indicators loaded for the selected period and environment.
   */
  private readonly _dashboard = signal<KpiDashboard | null>(null);

  /**
   * Deviation indicators loaded for the selected environment and period.
   */
  private readonly _deviationTrends = signal<DeviationTrend[]>([]);

  /**
   * Current audit log entries loaded from the backend.
   */
  private readonly _auditLogs = signal<AuditLogEntry[]>([]);

  /**
   * Indicates whether an asynchronous operation is currently in progress.
   */
  private readonly _isLoading = signal<boolean>(false);

  /**
   * Latest error as a translation key or server detail.
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Latest confirmation as a translation key.
   */
  private readonly _successMsg = signal<string | null>(null);

  /**
   * Report generated for the preview: its file, the key of its parameters and how it is downloaded.
   */
  private readonly _reportPreview = signal<{ key: string; file: Blob; filename: string; success: string } | null>(null);

  /**
   * Read-only signal for the indicators of the laboratory.
   */
  readonly dashboard = this._dashboard.asReadonly();

  /**
   * Read-only signal for the deviation indicators of the environment.
   */
  readonly deviationTrends = this._deviationTrends.asReadonly();

  /**
   * Read-only signal for the current audit log collection.
   */
  readonly auditLogs = this._auditLogs.asReadonly();

  /**
   * Read-only signal indicating whether the store is loading data.
   */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Read-only signal containing the latest error message.
   */
  readonly error = this._error.asReadonly();

  /**
   * Read-only signal containing the latest success message.
   */
  readonly successMsg = this._successMsg.asReadonly();

  private readonly _environments = signal<OverviewEnvironment[]>([]);
  private readonly _environmentsLoaded = signal(false);
  /** Environment opened last time in the monitoring views of this browser, shared with Tracking and the alerts. */
  private readonly environmentPreference = new EnvironmentPreference('tracking');

  /** Environments of the laboratory that indicators, trends and reports cover. */
  readonly environments = this._environments.asReadonly();
  /** Whether the environments have been read at least once. */
  readonly environmentsLoaded = this._environmentsLoaded.asReadonly();
  /** Whether the laboratory has no environment yet. */
  readonly environmentsEmpty = computed(() => this._environmentsLoaded() && this._environments().length === 0);

  /** Requests of the operational overview in progress, by the part they load. */
  private readonly overviewRequests = new Map<unknown, Request>();
  private readonly _overviewLaboratory = overviewState<OverviewLaboratory>();
  private readonly _overviewEquipment = overviewState<OverviewEquipment[]>();
  private readonly _overviewBatches = overviewState<OverviewBatch[]>();
  private readonly _overviewMaterials = overviewState<OverviewRawMaterial[]>();
  private readonly _overviewAlerts = overviewState<OverviewAlert[]>();
  private readonly _overviewMeasurements = overviewState<OverviewReading[]>();
  private readonly _overviewSubscription = overviewState<OverviewSubscription | null>();
  private readonly _overviewPlans = overviewState<OverviewPlan[]>();
  private readonly _overviewDeviceId = signal<number | null>(null);
  private readonly _overviewSeriesKey = signal('');

  /** Laboratory of the overview. */
  readonly overviewLaboratory = this._overviewLaboratory.asReadonly();
  /** Equipment and IoT devices of the laboratory. */
  readonly overviewEquipment = this._overviewEquipment.asReadonly();
  /** Production batches of the laboratory. */
  readonly overviewBatches = this._overviewBatches.asReadonly();
  /** Raw materials with low usable stock, from every environment. */
  readonly overviewMaterials = this._overviewMaterials.asReadonly();
  /** Open alerts of every environment. */
  readonly overviewAlerts = this._overviewAlerts.asReadonly();
  /** Readings of the selected device in the last 24 hours. */
  readonly overviewMeasurements = this._overviewMeasurements.asReadonly();
  /** Active subscription of the laboratory; its data is null when there is none. */
  readonly overviewSubscription = this._overviewSubscription.asReadonly();
  /** Subscription plans. */
  readonly overviewPlans = this._overviewPlans.asReadonly();
  /** Device whose readings are charted; null while none is selected. */
  readonly overviewDeviceId = this._overviewDeviceId.asReadonly();
  /** Variable chosen in the chart; empty for the first one. */
  readonly overviewSeriesKey = this._overviewSeriesKey.asReadonly();
  /** Only quality managers see the subscription. */
  readonly managesSubscription = this.iam.canManageQuality;
  /** IoT devices of the laboratory. */
  readonly overviewDevices = computed(() => (this._overviewEquipment().data ?? []).filter((item) => item.isIotDevice));
  /** Whether a part of the overview is being loaded. */
  readonly overviewLoading = computed(() =>
    [
      this._overviewLaboratory(),
      this._overviewEquipment(),
      this._overviewBatches(),
      this._overviewMaterials(),
      this._overviewAlerts(),
      this._overviewMeasurements(),
      this._overviewSubscription(),
      this._overviewPlans(),
    ].some((state) => state.status === 'loading'),
  );
  /** Open alerts, critical and newest first. */
  readonly overviewOpenAlerts = computed(() =>
    (this._overviewAlerts().data ?? [])
      .filter((alert) => alert.isOpen)
      .sort(
        (a, b) =>
          Number(b.severity === 'CRITICAL') - Number(a.severity === 'CRITICAL') ||
          Date.parse(b.timestamp) - Date.parse(a.timestamp),
      ),
  );
  /** Raw materials whose usable stock is low. */
  readonly overviewLowStock = computed(() => (this._overviewMaterials().data ?? []).filter((item) => item.isLowStock));
  /** Plan of the active subscription. */
  readonly overviewCurrentPlan = computed(() => {
    const subscription = this._overviewSubscription().data;
    return (
      this._overviewPlans().data?.find(
        (plan) => plan.code === subscription?.planCode && plan.billingPeriod === subscription.billingCycle,
      ) ?? null
    );
  });
  /** Variables that the selected device reported. */
  readonly overviewSeries = computed(() => {
    const series = new Map<string, { key: string; parameter: string; unit: string }>();
    for (const reading of this._overviewMeasurements().data ?? []) {
      const key = JSON.stringify([reading.metric, reading.unit]);
      series.set(key, { key, parameter: reading.metric, unit: reading.unit });
    }
    return [...series.values()];
  });
  /** Variable shown in the chart. */
  readonly overviewActiveSeries = computed<{ key: string; parameter: string; unit: string } | null>(
    () =>
      this.overviewSeries().find((item) => item.key === this._overviewSeriesKey()) ?? this.overviewSeries()[0] ?? null,
  );
  /** Latest readings of the variable shown, oldest first. */
  readonly overviewReadings = computed(() =>
    (this._overviewMeasurements().data ?? [])
      .filter(
        (reading) =>
          reading.metric === this.overviewActiveSeries()?.parameter &&
          reading.unit === this.overviewActiveSeries()?.unit,
      )
      .sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt))
      .slice(-OVERVIEW_READINGS),
  );
  /** Latest reading of the variable shown. */
  readonly overviewLatestReading = computed(() => this.overviewReadings().at(-1) ?? null);
  /** Lowest and highest reading of the variable shown. */
  readonly overviewReadingRange = computed(() => {
    const values = this.overviewReadings().map((reading) => reading.value ?? 0);
    return values.length ? { min: Math.min(...values), max: Math.max(...values) } : null;
  });

  /**
   * Reads the environments of the laboratory (Laboratory → Reporting & Audit).
   *
   * @remarks
   * On failure the previous list is kept and {@link RaStore.error} explains that the data could not be loaded.
   */
  async loadEnvironments(): Promise<void> {
    try {
      this._environments.set(await firstValueFrom(this.api.getOverviewEnvironments(this.iam.requireLaboratoryId())));
      this._environmentsLoaded.set(true);
    } catch {
      this._error.set('reporting.errors.load');
    }
  }

  /**
   * The environment to open: the last one chosen in the monitoring views of this browser, or the first one.
   *
   * @returns The environment identifier, or null when the laboratory has none
   */
  preferredEnvironmentId(): number | null {
    return this.environmentPreference.choose(this.iam.requireLaboratoryId(), this._environments())?.id ?? null;
  }

  /**
   * Remembers the environment the person chose, for the next visit to the monitoring views.
   *
   * @param environmentId - The environment identifier
   */
  rememberEnvironment(environmentId: number): void {
    this.environmentPreference.remember(this.iam.requireLaboratoryId(), environmentId);
  }

  /**
   * Reads the batches of the laboratory again, newest first, for the batch report (Product Batch → Reporting &
   * Audit, through {@link RaApi}).
   */
  loadBatches(): void {
    this.loadOverview(
      this._overviewBatches,
      this.api
        .getOverviewBatches(this.iam.requireLaboratoryId())
        .pipe(map((batches) => [...batches].sort((a, b) => b.id - a.id))),
    );
  }

  /**
   * Loads every part of the operational overview of the laboratory of the session.
   */
  reloadOverview(): void {
    const preferredDevice = this._overviewDeviceId();
    const laboratoryId = this.iam.requireLaboratoryId();
    this.clearProfiles();
    this.overviewRequests.forEach((request) => request.unsubscribe());
    this.overviewRequests.clear();
    this._overviewDeviceId.set(null);
    this._overviewMeasurements.set({ status: 'idle', data: null });
    this._overviewAlerts.set({ status: 'loading', data: null });
    this.loadOverview(this._overviewLaboratory, this.api.getOverviewLaboratory(laboratoryId));
    // Low stock is classified per environment by Inventory (TS27); the overview adds up every environment.
    this.loadOverview(this._overviewMaterials, this.eachEnvironment(laboratoryId, (environmentId) =>
      this.api.getOverviewLowStockMaterials(laboratoryId, environmentId)));
    this.loadOverview(this._overviewBatches, this.api.getOverviewBatches(laboratoryId));
    this.loadOverview(
      this._overviewEquipment,
      this.api.getOverviewEquipment(laboratoryId).pipe(map((items) => items.filter((item) => item.laboratoryId === laboratoryId))),
      (items) => {
        const devices = items.filter((item) => item.isIotDevice);
        this.selectOverviewDevice(devices.find((item) => item.id === preferredDevice)?.id ?? devices[0]?.id ?? null);
      },
    );
    this.loadOverviewAlerts();
    if (this.managesSubscription()) {
      this.loadOverviewSubscription();
      this.loadOverviewPlans();
    }
  }

  /** Loads the active subscription of the laboratory. */
  loadOverviewSubscription(): void {
    const laboratoryId = this.iam.requireLaboratoryId();
    this.loadOverview(
      this._overviewSubscription,
      this.api.getOverviewSubscription(laboratoryId).pipe(
        map((subscription) => {
          if (subscription && subscription.laboratoryId !== laboratoryId) throw new Error('Unexpected laboratory');
          return subscription;
        }),
      ),
    );
  }

  /** Loads the subscription plans. */
  loadOverviewPlans(): void {
    this.loadOverview(this._overviewPlans, this.api.getOverviewPlans());
  }

  /** Loads the open alerts of every environment (US85); an incomplete load is never shown as zero alerts. */
  loadOverviewAlerts(): void {
    const laboratoryId = this.iam.requireLaboratoryId();
    this.loadOverview(this._overviewAlerts, this.eachEnvironment(laboratoryId, (environmentId) =>
      this.api.getOverviewOpenAlerts(laboratoryId, environmentId)));
  }

  /**
   * Charts the readings of an IoT device of the last 24 hours.
   *
   * @param deviceId - The device identifier, or null to clear the chart
   */
  selectOverviewDevice(deviceId: number | null): void {
    if (deviceId !== null && !this.overviewDevices().some((item) => item.id === deviceId)) return;
    this.overviewRequests.get(this._overviewMeasurements)?.unsubscribe();
    this._overviewDeviceId.set(deviceId);
    this._overviewMeasurements.set({ status: 'idle', data: null });
    const device = this.overviewDevices().find((item) => item.id === deviceId);
    if (!device) return;
    // A device only reports readings once it is located in an environment.
    if (device.environmentId === null) {
      this._overviewMeasurements.set({ status: 'ready', data: [] });
      return;
    }
    this.loadOverview(
      this._overviewMeasurements,
      this.api
        .getOverviewReadings(
          this.iam.requireLaboratoryId(),
          device.environmentId,
          device.isContainerMonitor ? device.id : null,
          lastDays(1),
        )
        .pipe(map((readings) => readings.filter((reading) => reading.deviceId === deviceId && reading.isChartable))),
    );
  }

  /**
   * Chooses the variable shown in the chart.
   *
   * @param key - Key of a series of {@link overviewSeries}
   */
  selectOverviewSeries(key: string): void {
    this._overviewSeriesKey.set(key);
  }

  /**
   * Name of an equipment of the overview, or its identifier while it is not loaded.
   *
   * @param equipmentId - The equipment identifier
   */
  overviewEquipmentName(equipmentId: number): string {
    return this._overviewEquipment().data?.find((item) => item.id === equipmentId)?.name ?? String(equipmentId);
  }

  /**
   * Name of a device of the laboratory, or null while the equipment is not loaded.
   *
   * @param deviceId - Identifier of the environmental device or container monitor
   */
  deviceName(deviceId: number): string | null {
    return this._overviewEquipment().data?.find((device) => device.id === deviceId)?.name ?? null;
  }

  /** Loads the equipment of the laboratory once, to show the name of the device of each indicator. */
  loadDevices(): void {
    const status = this._overviewEquipment().status;
    if (status === 'idle' || status === 'error') this.loadEquipment();
  }

  /**
   * Reads the equipment of the laboratory again: the names of the devices and the equipment of the equipment log
   * report (Equipment → Reporting & Audit, through {@link RaApi}).
   */
  loadEquipment(): void {
    const laboratoryId = this.iam.requireLaboratoryId();
    this.loadOverview(
      this._overviewEquipment,
      this.api.getOverviewEquipment(laboratoryId).pipe(map((items) => items.filter((item) => item.laboratoryId === laboratoryId))),
    );
  }

  /**
   * Fetches the indicators of the laboratory for a period (US93, TS81).
   *
   * @param period - Period of the measurement summaries (at most 31 days)
   * @param environmentId - Optional environment; null covers every environment of the laboratory
   */
  loadDashboard(period: IndicatorPeriod, environmentId: number | null): void {
    this.reloadDashboard.next();
    this._dashboard.set(null);
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getDashboardByLaboratory(this.iam.requireLaboratoryId(), period, environmentId)
      .pipe(takeUntil(this.reloadDashboard), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard: KpiDashboard) => {
          this._dashboard.set(dashboard);
          this._isLoading.set(false);
        },
        error: () => {
          this._error.set('reporting.errors.load');
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Fetches the deviation indicators of the variables of an environment (US94, TS82).
   *
   * @param environmentId - The environment whose readings are evaluated
   * @param period - Period of at most 31 days
   */
  loadDeviationTrends(environmentId: number, period: IndicatorPeriod): void {
    this.reloadTrends.next();
    this._deviationTrends.set([]);
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getTrendsByEnvironment(this.iam.requireLaboratoryId(), environmentId, period)
      .pipe(takeUntil(this.reloadTrends), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (trends: DeviationTrend[]) => {
          this._deviationTrends.set(trends);
          this._isLoading.set(false);
        },
        error: () => {
          this._error.set('reporting.errors.load');
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Fetches audit log entries based on optional filters.
   *
   * @param filters - Optional criteria to filter the audit log entries
   * @param filters.equipmentId - Equipment numeric identifier filter
   * @param filters.batchId - Batch numeric identifier filter
   * @param filters.dateFrom - Start date for the audit log query
   * @param filters.dateTo - End date for the audit log query
   *
   * @remarks
   * When no filters are provided, the backend is expected to return the default
   * audit log collection.
   */
  loadAuditLog(filters?: {
    equipmentId?: number;
    batchId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): void {
    this.reloadAudit.next();
    this._auditLogs.set([]);
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getAuditLog(this.iam.requireLaboratoryId(), filters)
      .pipe(takeUntil(this.reloadAudit), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (logs: AuditLogEntry[]) => {
          this._auditLogs.set(logs);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to load audit logs'));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Generates and downloads a report.
   *
   * @remarks
   * The platform stores every report it generates, so a report already generated for the preview with the same
   * parameters is downloaded again instead of generating another one.
   *
   * @param order - Type and parameters of the report
   */
  generateReport(order: ReportOrder): void {
    const report = this.describeReport(order);
    const preview = this._reportPreview();
    if (preview?.key === report.key) {
      this.downloadPreview();
      return;
    }
    this.download(report.request(), report.filename, report.success, report.fallback);
  }

  /**
   * Generates a report to show it before downloading it, without downloading it.
   *
   * @remarks
   * The file is kept until {@link RaStore.clearReportPreview}, so downloading it afterwards does not generate the
   * report again. On failure the reason is exposed through {@link RaStore.error}.
   *
   * @param order - Type and parameters of the report
   * @returns The file, or null when it could not be generated
   */
  async previewReport(order: ReportOrder): Promise<Blob | null> {
    const report = this.describeReport(order);
    const preview = this._reportPreview();
    if (preview?.key === report.key) return preview.file;
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);
    try {
      const file = await firstValueFrom(report.request());
      this._reportPreview.set({ key: report.key, file, filename: report.filename, success: report.success });
      return file;
    } catch (error) {
      this._error.set(this.formatError(error, report.fallback));
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Downloads the report generated for the preview.
   */
  downloadPreview(): void {
    const preview = this._reportPreview();
    if (!preview) return;
    this._error.set(null);
    this.downloadFile(preview.file, preview.filename);
    this._successMsg.set(preview.success);
  }

  /**
   * Forgets the report generated for the preview, so the next download generates a new one.
   */
  clearReportPreview(): void {
    this._reportPreview.set(null);
  }

  /**
   * Clears transient error and success messages.
   */
  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  private download(request: ReturnType<RaApi['generateBatchReport']>, filename: string, success: string,
                   fallback: string): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, filename);
        this._successMsg.set(success);
        this._isLoading.set(false);
      },
      error: (err: unknown) => {
        this._error.set(this.formatError(err, fallback));
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Formats unknown API errors into user-facing messages.
   *
   * @param error - Error object received from the API layer
   * @param fallback - Fallback message used when the error cannot be parsed
   * @returns A formatted error message
   */
  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not Found`
        : error.message;
    }

    return fallback;
  }

  /**
   * Downloads a Blob as a local file through a temporary browser anchor.
   *
   * @param blob - Binary content returned by the backend
   * @param filename - Suggested file name for the download
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Reads something of every environment of the laboratory and joins the answers.
   *
   * @param laboratoryId - The laboratory identifier
   * @param read - What is read of one environment
   * @returns Observable emitting the joined answers once every environment answered
   */
  private eachEnvironment<T>(laboratoryId: number, read: (environmentId: number) => Observable<T[]>): Observable<T[]> {
    return this.api.getOverviewEnvironments(laboratoryId).pipe(
      mergeMap((environments) =>
        from(environments.map((environment) => environment.id)).pipe(
          mergeMap((environmentId) => read(environmentId), ENVIRONMENT_REQUESTS),
          toArray(),
          map((groups) => groups.flat()),
        ),
      ),
    );
  }

  /**
   * Loads one part of the operational overview, cancelling the previous request of that part.
   *
   * @param target - The part of the overview
   * @param source - The request
   * @param after - What to do once the part is loaded
   */
  private loadOverview<T>(target: WritableSignal<OverviewState<T>>, source: Observable<T>, after?: (data: T) => void): void {
    this.overviewRequests.get(target)?.unsubscribe();
    target.set({ status: 'loading', data: null });
    this.overviewRequests.set(
      target,
      source.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => {
          target.set({ status: 'ready', data });
          after?.(data);
        },
        error: () => target.set({ status: 'error', data: null }),
      }),
    );
  }

  /**
   * Reads the environmental profile of one device (environment or container monitor) so KPI cards can be colored.
   *
   * @remarks
   * It dynamically chooses the correct endpoint based on the equipment type, so it waits until the equipment is known:
   * call it from an effect, which runs again when the equipment arrives. Each profile is requested once.
   * A 404 (not configured) resolves to null; other failures are silent.
   *
   * @param deviceId - The device whose profile is required.
   * @param environmentId - The environment where the device is located.
   */
  loadProfile(deviceId: number, environmentId: number): void {
    const equipment = this._overviewEquipment();
    if (equipment.status !== 'ready' || this.requestedProfiles.has(deviceId)) return;
    this.requestedProfiles.add(deviceId);
    const laboratoryId = this.iam.requireLaboratoryId();
    const isContainer = equipment.data?.find(e => e.id === deviceId)?.isContainerMonitor === true;
    const request$ = isContainer
      ? this.api.getOverviewContainerMonitorProfile(laboratoryId, environmentId, deviceId)
      : this.api.getOverviewEnvironmentalProfile(laboratoryId, environmentId);
    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this._profiles.update((map) => ({ ...map, [deviceId]: profile })),
        error: () => this._profiles.update((map) => ({ ...map, [deviceId]: null })),
      });
  }

  /**
   * Forgets the profiles read, forcing a new fetch next time they are needed.
   *
   * @remarks
   * Useful when changing laboratories or manually reloading the dashboard.
   */
  clearProfiles(): void {
    this.requestedProfiles.clear();
    this._profiles.set({});
  }

  /**
   * Request, file name and messages of a report.
   *
   * @param order - Type and parameters of the report
   * @returns The key that identifies the report by its parameters, the request that generates it, its file name and
   *   the translation keys of its success and failure
   */
  private describeReport(order: ReportOrder): ReportDescription {
    const key = JSON.stringify(order);
    const extension = order.command.format.toLowerCase();
    switch (order.type) {
      case 'batch':
        return { key, request: () => this.api.generateBatchReport(order.command),
          filename: `Batch_Report_${order.command.batchId}.${extension}`,
          success: 'report-generator.success.batch', fallback: 'report-generator.errors.batch' };
      case 'compliance': {
        const { environmentId, laboratoryId, startDate, endDate } = order.command;
        return { key, request: () => this.api.generateComplianceReport(order.command),
          filename: `Environmental_Report_${environmentId ?? laboratoryId}_${startDate}_${endDate}.${extension}`,
          success: 'report-generator.success.compliance', fallback: 'report-generator.errors.compliance' };
      }
      case 'inventory':
        return { key, request: () => this.api.generateInventoryReport(order.command),
          filename: `Inventory_Report_${order.command.environmentId ?? order.command.laboratoryId}.${extension}`,
          success: 'report-generator.success.inventory', fallback: 'report-generator.errors.inventory' };
      case 'equipment':
        return { key, request: () => this.api.exportEquipmentLog(order.command),
          filename: `Equipment_Log_${order.command.equipmentId}.${extension}`,
          success: 'report-generator.success.equipment', fallback: 'report-generator.errors.equipment' };
    }
  }
}

/**
 * How a report is generated and delivered.
 */
interface ReportDescription {
  /** Identifies the report by its type and parameters. */
  key: string;
  /** Generates the report and reads its file. */
  request: () => Observable<Blob>;
  /** Name of the downloaded file. */
  filename: string;
  /** Translation key shown once the file is downloaded. */
  success: string;
  /** Translation key shown when the report cannot be generated. */
  fallback: string;
}
