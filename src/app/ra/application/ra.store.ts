import { DestroyRef, Injectable, signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import { RaApi } from '../infrastructure/ra-api';

import { KpiDashboard } from '../domain/model/kpi-dashboard.entity';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { AuditLogEntry } from '../domain/model/audit-log-entry.entity';

import { GenerateBatchReportCommand } from '../domain/model/generate-batch-report.command';
import { GenerateComplianceReportCommand } from '../domain/model/generate-compliance-report.command';
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
 * - KPI dashboards for laboratories
 * - Deviation trends for equipment
 * - Audit log entries
 * - Report generation and file downloads
 */
@Injectable({ providedIn: 'root' })
export class RaStore {
  /**
   * Infrastructure API facade for Reporting and Analysis operations.
   */
  private readonly api = inject(RaApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadDashboard = new Subject<void>();
  private readonly reloadTrends = new Subject<void>();
  private readonly reloadAudit = new Subject<void>();

  /**
   * Current KPI dashboard loaded for the selected laboratory.
   */
  private readonly _dashboard = signal<KpiDashboard | null>(null);

  /**
   * Current deviation trend collection loaded for the selected equipment.
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
   * Stores the latest error message, if any.
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Stores the latest success message, if any.
   */
  private readonly _successMsg = signal<string | null>(null);

  /**
   * Read-only signal for the current KPI dashboard.
   */
  readonly dashboard = this._dashboard.asReadonly();

  /**
   * Read-only signal for the current deviation trend collection.
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
   * Computed collection of KPI metrics with critical status.
   *
   * @returns Metrics whose status is `CRITICAL`.
   */
  readonly criticalMetrics = computed(() => {
    const dashboard = this._dashboard();
    return dashboard ? dashboard.metrics.filter((metric) => metric.status === 'CRITICAL') : [];
  });

  /**
   * Computed collection of KPI metrics at risk.
   *
   * @returns Metrics whose status is `AT_RISK`.
   */
  readonly atRiskMetrics = computed(() => {
    const dashboard = this._dashboard();
    return dashboard ? dashboard.metrics.filter((metric) => metric.status === 'AT_RISK') : [];
  });

  /**
   * Indicates whether the loaded dashboard contains critical metrics.
   */
  readonly hasCriticalDeviations = computed(() => this.criticalMetrics().length > 0);

  /**
   * Fetches the KPI dashboard for a specific laboratory.
   *
   * @param laboratoryId - The unique numeric identifier of the laboratory
   *
   * @remarks
   * Delegates the operation to {@link RaApi.getDashboardByLaboratory} and stores
   * the resulting dashboard in the local signal state.
   */
  loadDashboard(laboratoryId: number): void {
    this.reloadDashboard.next();
    this._dashboard.set(null);
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getDashboardByLaboratory(laboratoryId)
      .pipe(takeUntil(this.reloadDashboard), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard: KpiDashboard) => {
          this._dashboard.set(dashboard);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to load KPI dashboard'));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Fetches deviation trends for a specific equipment.
   *
   * @param equipmentId - The unique numeric identifier of the equipment
   *
   * @remarks
   * Loads all trend analyses associated with the equipment and replaces the
   * current deviation trend state.
   */
  loadDeviationTrends(equipmentId: number): void {
    this.reloadTrends.next();
    this._deviationTrends.set([]);
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getTrendsByEquipment(equipmentId)
      .pipe(takeUntil(this.reloadTrends), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (trends: DeviationTrend[]) => {
          this._deviationTrends.set(trends);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to load deviation trends'));
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
      .getAuditLog(filters)
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
   * Generates and downloads a production batch report.
   *
   * @param command - Command containing batch report generation parameters
   *
   * @remarks
   * The backend returns a binary Blob. The store converts it into a downloadable
   * file and updates the success/error state accordingly.
   */
  generateBatchReport(command: GenerateBatchReportCommand): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);

    this.api.generateBatchReport(command).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob: Blob) => {
        const filename = `Batch_Report_${command.batchId}.${command.format.toLowerCase()}`;
        this.downloadFile(blob, filename);
        this._successMsg.set('Batch report downloaded successfully');
        this._isLoading.set(false);
      },
      error: (err: unknown) => {
        this._error.set(this.formatError(err, 'Failed to generate batch report'));
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Generates and downloads a regulatory compliance report.
   *
   * @param command - Command containing compliance report generation parameters
   *
   * @remarks
   * Uses `laboratoryId` to identify the laboratory whose compliance information
   * should be included in the generated report.
   */
  generateComplianceReport(command: GenerateComplianceReportCommand): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);

    this.api.generateComplianceReport(command).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob: Blob) => {
        const filename = `Compliance_Report_${command.laboratoryId}.${command.format.toLowerCase()}`;
        this.downloadFile(blob, filename);
        this._successMsg.set('Compliance report downloaded successfully');
        this._isLoading.set(false);
      },
      error: (err: unknown) => {
        this._error.set(this.formatError(err, 'Failed to generate compliance report'));
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Exports and downloads historical equipment logs.
   *
   * @param command - Command containing equipment log export parameters
   */
  exportEquipmentLog(command: ExportEquipmentLogCommand): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);

    this.api.exportEquipmentLog(command).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob: Blob) => {
        const filename = `Equipment_Log_${command.equipmentId}.${command.format.toLowerCase()}`;
        this.downloadFile(blob, filename);
        this._successMsg.set('Equipment log exported successfully');
        this._isLoading.set(false);
      },
      error: (err: unknown) => {
        this._error.set(this.formatError(err, 'Failed to export equipment log'));
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Clears transient error and success messages.
   */
  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
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
