import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { KpiDashboard } from '../domain/model/kpi-dashboard.entity';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { AuditLogEntry } from '../domain/model/audit-log-entry.entity';

import { KpiApiEndpoint } from './kpi-api-endpoint';
import { DeviationTrendApiEndpoint } from './deviation-trend-api-endpoint';
import { AuditLogApiEndpoint } from './audit-log-api-endpoint';
import { ReportApiEndpoint } from './report-api-endpoint';
import { IndicatorPeriod } from '../domain/model/indicator-period';

import {
  GenerateBatchReportRequest,
  GenerateComplianceReportRequest,
  ExportEquipmentLogRequest,
  GenerateInventoryReportRequest,
} from './report.request';

/**
 * Infrastructure service facade for Reporting and Analysis (RA) external API operations.
 *
 * @remarks
 * In Domain-Driven Design, this service acts as the infrastructure layer facade
 * coordinating access to RA-related API resources through HTTP endpoints.
 * It orchestrates interactions between the application layer and the underlying
 * infrastructure endpoints for KPI dashboards, deviation trends, audit logs,
 * and generated reports.
 *
 * The RaApi abstracts away the complexity of managing multiple endpoint clients,
 * providing a unified interface for application services and stores to interact
 * with reporting data.
 */
@Injectable({ providedIn: 'root' })
export class RaApi extends BaseApi {
  /**
   * Endpoint client responsible for KPI dashboard requests.
   */
  private readonly _kpiEndpoint: KpiApiEndpoint;

  /**
   * Endpoint client responsible for deviation trend requests.
   */
  private readonly _deviationTrendEndpoint: DeviationTrendApiEndpoint;

  /**
   * Endpoint client responsible for audit log requests.
   */
  private readonly _auditLogEndpoint: AuditLogApiEndpoint;

  /**
   * Endpoint client responsible for report generation requests.
   */
  private readonly _reportEndpoint: ReportApiEndpoint;

  /**
   * Creates an instance of RaApi.
   *
   * @param http - Angular HttpClient used by the underlying endpoint clients
   *
   * @remarks
   * Initializes specialized endpoint clients for each RA capability. Each endpoint
   * handles its own HTTP path, serialization details, and assembler usage.
   */
  constructor(http: HttpClient) {
    super();
    this._kpiEndpoint = new KpiApiEndpoint(http);
    this._deviationTrendEndpoint = new DeviationTrendApiEndpoint(http);
    this._auditLogEndpoint = new AuditLogApiEndpoint(http);
    this._reportEndpoint = new ReportApiEndpoint(http);
  }

  /**
   * Retrieves the indicators of a laboratory for a period (US93).
   *
   * @param laboratoryId - The unique numeric identifier of the laboratory
   * @param period - Period of the measurement summaries; the platform uses the last 7 days when omitted
   * @param environmentId - Optional environment; null covers every environment
   * @returns Observable stream emitting the {@link KpiDashboard} domain entity
   *
   * @remarks
   * Delegates the request to {@link KpiApiEndpoint}, which calls:
   * `GET /laboratories/{laboratoryId}/kpi-dashboards?from&to&environmentId`.
   */
  getDashboardByLaboratory(laboratoryId: number, period?: IndicatorPeriod, environmentId?: number | null): Observable<KpiDashboard> {
    return this._kpiEndpoint.getDashboardByLaboratory(laboratoryId, period, environmentId);
  }

  /**
   * Retrieves the deviation indicators of the variables of an environment in a period (US94).
   *
   * @param environmentId - The environment whose readings are evaluated
   * @param period - Period of at most 31 days
   * @returns Observable stream emitting an array of {@link DeviationTrend} domain entities
   *
   * @remarks
   * Delegates the request to {@link DeviationTrendApiEndpoint}, which calls:
   * `GET /laboratories/{laboratoryId}/environments/{environmentId}/deviation-trends?from&to`.
   */
  getTrendsByEnvironment(laboratoryId: number, environmentId: number, period: IndicatorPeriod): Observable<DeviationTrend[]> {
    return this._deviationTrendEndpoint.getTrendsByEnvironment(laboratoryId, environmentId, period);
  }

  /**
   * Retrieves audit log entries based on optional filter criteria.
   *
   * @param filters - Optional query filters for the audit log
   * @param filters.equipmentId - Equipment numeric identifier filter
   * @param filters.batchId - Batch numeric identifier filter
   * @param filters.dateFrom - Start date for the audit log query
   * @param filters.dateTo - End date for the audit log query
   * @returns Observable stream emitting an array of {@link AuditLogEntry} domain entities
   *
   * @remarks
   * Delegates the request to {@link AuditLogApiEndpoint}, which calls:
   * `GET /laboratories/{laboratoryId}/equipments/{equipmentId}/audit-logs` or `GET /batches/{batchId}/audit-logs`.
   */
  getAuditLog(laboratoryId: number, filters?: {
    equipmentId?: number;
    batchId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<AuditLogEntry[]> {
    return this._auditLogEndpoint.getAuditLog(laboratoryId, filters);
  }

  /**
   * Requests the generation of a production batch report.
   *
   * @param request - DTO containing batch report generation parameters
   * @returns Observable stream emitting the generated report as a binary {@link Blob}
   *
   * @remarks
   * Delegates the request to {@link ReportApiEndpoint}, which calls:
   * `POST /reports/batches`.
   */
  /**
   * Retrieves what a staff member did with their account.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param staffId - Numeric identifier of the staff member
   * @returns Observable stream emitting the audit log entries performed by the staff member
   */
  getStaffActivity(laboratoryId: number, staffId: number): Observable<AuditLogEntry[]> {
    return this._auditLogEndpoint.getStaffActivity(laboratoryId, staffId);
  }

  generateBatchReport(request: GenerateBatchReportRequest): Observable<Blob> {
    return this._reportEndpoint.generateBatchReport(request);
  }

  /**
   * Requests the generation of a regulatory compliance report.
   *
   * @param request - DTO containing compliance report generation parameters
   * @returns Observable stream emitting the generated report as a binary {@link Blob}
   *
   * @remarks
   * Delegates the request to {@link ReportApiEndpoint}, which calls:
   * `POST /reports/compliance`.
   */
  generateComplianceReport(request: GenerateComplianceReportRequest): Observable<Blob> {
    return this._reportEndpoint.generateComplianceReport(request);
  }

  /**
   * Requests the export of historical equipment logs.
   *
   * @param request - DTO containing equipment log export parameters
   * @returns Observable stream emitting the exported report as a binary {@link Blob}
   *
   * @remarks
   * Delegates the request to {@link ReportApiEndpoint}, which calls:
   * `POST /reports/equipment-logs`.
   */
  generateInventoryReport(request: GenerateInventoryReportRequest): Observable<Blob> {
    return this._reportEndpoint.generateInventoryReport(request);
  }

  exportEquipmentLog(request: ExportEquipmentLogRequest): Observable<Blob> {
    return this._reportEndpoint.exportEquipmentLog(request);
  }
}
