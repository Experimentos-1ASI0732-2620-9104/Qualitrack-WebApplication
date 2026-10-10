import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GenerateBatchReportRequest,
  GenerateBatchReportBody,
  GenerateComplianceReportRequest,
  GenerateComplianceReportBody,
  ExportEquipmentLogRequest,
  ExportEquipmentLogBody,
  GenerateInventoryReportRequest,
  GenerateInventoryReportBody,
} from './report.request';

const batchesEndpointUrl = `${environment.serverBasePath}${environment.batchEndpointPath}`;
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;
const reportsEndpointUrl = `${environment.serverBasePath}${environment.raReportsEndpointPath}`;

/** Report stored by the platform; only its identifier is needed to download it. */
interface CreatedReportResource {
  id: number;
}

/**
 * Generates reports from the persisted records. The platform answers 201 with the stored report (TS83, TS84, TS86)
 * and its PDF or CSV is then downloaded from /reports/{reportId}/content (TS87).
 */
export class ReportApiEndpoint {
  constructor(private readonly http: HttpClient) {}

  generateBatchReport(request: GenerateBatchReportRequest): Observable<Blob> {
    const body: GenerateBatchReportBody = {
      includeDeviations: request.includeDeviations,
      format: request.format,
    };
    return this.createAndDownload(
      `${batchesEndpointUrl}/${request.batchId}${environment.batchReportsEndpointPath}`, body,
      'report-generator.errors.batch');
  }

  generateComplianceReport(request: GenerateComplianceReportRequest): Observable<Blob> {
    const body: GenerateComplianceReportBody = {
      environmentId: request.environmentId,
      startDate: request.startDate,
      endDate: request.endDate,
      format: request.format,
    };
    return this.createAndDownload(
      `${laboratoriesEndpointUrl}/${request.laboratoryId}${environment.raComplianceReportsEndpointPath}`, body,
      'report-generator.errors.compliance');
  }

  /** Generates the inventory report and downloads it (US97, TS85). */
  generateInventoryReport(request: GenerateInventoryReportRequest): Observable<Blob> {
    const body: GenerateInventoryReportBody = { environmentId: request.environmentId, format: request.format };
    return this.createAndDownload(
      `${laboratoriesEndpointUrl}/${request.laboratoryId}${environment.raInventoryReportsEndpointPath}`, body,
      'report-generator.errors.inventory');
  }

  exportEquipmentLog(request: ExportEquipmentLogRequest): Observable<Blob> {
    const body: ExportEquipmentLogBody = {
      startDate: request.startDate,
      endDate: request.endDate,
      format: request.format,
    };
    const equipmentUrl = `${laboratoriesEndpointUrl}/${request.laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}`
      + `/${request.environmentId}${environment.equipmentEndpointPath}/${request.equipmentId}`;
    return this.createAndDownload(`${equipmentUrl}${environment.equipmentLogReportsEndpointPath}`, body,
      'report-generator.errors.equipment');
  }

  private createAndDownload(url: string, body: object, fallback: string): Observable<Blob> {
    return this.http.post<CreatedReportResource>(url, body).pipe(
      switchMap((report) => this.http.get(
        `${reportsEndpointUrl}/${report.id}${environment.raReportContentEndpointPath}`, { responseType: 'blob' })),
      catchError((err: unknown) => this.reportError(err, fallback)),
    );
  }

  private reportError(error: unknown, fallback: string): Observable<never> {
    let message = fallback;
    // File requests also return JSON errors as Blobs; status remains reliable without decoding the body.
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403 || error.status === 404) message = 'report-generator.errors.resource-unavailable';
      else if (error.status === 401) message = 'report-generator.errors.session-expired';
      else if (error.status === 0) message = 'report-generator.errors.connection';
      else if (error.status === 400) message = 'report-generator.errors.invalid-request';
    }
    return throwError(() => new Error(message, { cause: error }));
  }
}
