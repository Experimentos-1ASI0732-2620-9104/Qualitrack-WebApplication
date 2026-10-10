import { DestroyRef, Injectable, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import { RaApi } from '../infrastructure/ra-api';
import { IamStore } from '../../iam/application/iam.store';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../equipment/domain/model/equipment.entity';

import { KpiDashboard } from '../domain/model/kpi-dashboard.entity';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { AuditLogEntry } from '../domain/model/audit-log-entry.entity';
import { IndicatorPeriod } from '../domain/model/indicator-period';

import { GenerateBatchReportCommand } from '../domain/model/generate-batch-report.command';
import { GenerateComplianceReportCommand } from '../domain/model/generate-compliance-report.command';
import { GenerateInventoryReportCommand } from '../domain/model/generate-inventory-report.command';
import { ExportEquipmentLogCommand } from '../domain/model/export-equipment-log.command';

/**
 * Application store for managing Reporting and Analysis (RA) state.
 *
 * @remarks
 * This store acts as the central state manager for the Reporting and Analysis
 * bounded context. It uses Angular Signals to expose reactive state to the
 * presentation layer and coordinates all data access through {@link RaApi}.
 *
 * It manages:
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
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly iam = inject(IamStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadDashboard = new Subject<void>();
  private readonly reloadTrends = new Subject<void>();
  private readonly reloadAudit = new Subject<void>();

  /**
   * Indicators loaded for the selected period and environment.
   */
  private readonly _dashboard = signal<KpiDashboard | null>(null);

  /**
   * Deviation indicators loaded for the selected environment and period.
   */
  private readonly _deviationTrends = signal<DeviationTrend[]>([]);

  /**
   * Equipment of the laboratory, used to show the name of the device of each indicator.
   */
  private readonly _devices = signal<Equipment[]>([]);

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

  /**
   * Name of a device of the laboratory, or null while the equipment is not loaded.
   *
   * @param deviceId - Identifier of the environmental device or container monitor
   */
  deviceName(deviceId: number): string | null {
    return this._devices().find((device) => device.id === deviceId)?.name ?? null;
  }

  /** Loads the equipment of the laboratory once, to show the name of the device of each indicator. */
  loadDevices(): void {
    if (this._devices().length) return;
    this.equipmentApi
      .getEquipment(this.iam.requireLaboratoryId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (devices) => this._devices.set(devices), error: () => this._devices.set([]) });
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
   * Generates and downloads the traceability report of a batch (US96).
   *
   * @param command - Batch, deviation section and format
   */
  generateBatchReport(command: GenerateBatchReportCommand): void {
    this.download(this.api.generateBatchReport(command),
      `Batch_Report_${command.batchId}.${command.format.toLowerCase()}`, 'report-generator.success.batch',
      'report-generator.errors.batch');
  }

  /**
   * Generates and downloads the environmental report of a period (US95).
   *
   * @param command - Laboratory, optional environment, calendar days and format
   */
  generateComplianceReport(command: GenerateComplianceReportCommand): void {
    const scope = command.environmentId ?? command.laboratoryId;
    this.download(this.api.generateComplianceReport(command),
      `Environmental_Report_${scope}_${command.startDate}_${command.endDate}.${command.format.toLowerCase()}`,
      'report-generator.success.compliance', 'report-generator.errors.compliance');
  }

  /**
   * Generates and downloads the inventory report of the laboratory or of one environment (US97).
   *
   * @param command - Laboratory, optional environment and format
   */
  generateInventoryReport(command: GenerateInventoryReportCommand): void {
    const scope = command.environmentId ?? command.laboratoryId;
    this.download(this.api.generateInventoryReport(command),
      `Inventory_Report_${scope}.${command.format.toLowerCase()}`, 'report-generator.success.inventory',
      'report-generator.errors.inventory');
  }

  /**
   * Exports and downloads the maintenance and operation log of an equipment (US98).
   *
   * @param command - Command containing equipment log export parameters
   */
  exportEquipmentLog(command: ExportEquipmentLogCommand): void {
    this.download(this.api.exportEquipmentLog(command),
      `Equipment_Log_${command.equipmentId}.${command.format.toLowerCase()}`, 'report-generator.success.equipment',
      'report-generator.errors.equipment');
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
}
