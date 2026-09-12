import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GenerateBatchReportRequest,
  GenerateBatchReportBody,
  GenerateComplianceReportRequest,
  GenerateComplianceReportBody,
  ExportEquipmentLogRequest,
  ExportEquipmentLogBody,
} from './report.request';

const batchesEndpointUrl = `${environment.serverBasePath}${environment.batchEndpointPath}`;
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;
const equipmentsEndpointUrl = `${environment.serverBasePath}${environment.equipmentEndpointPath}`;

export class ReportApiEndpoint {
  constructor(private readonly http: HttpClient) {}

  generateBatchReport(request: GenerateBatchReportRequest): Observable<Blob> {
    const body: GenerateBatchReportBody = {
      includeTelemetry: request.includeTelemetry,
      includeDeviations: request.includeDeviations,
      format: request.format,
      requestedBy: request.requestedBy,
    };

    return this.http
      .post(
        `${batchesEndpointUrl}/${request.batchId}${environment.batchReportsEndpointPath}`,
        body,
        { responseType: 'blob' },
      )
      .pipe(
        catchError((err: unknown) => this.reportError(err, 'report-generator.errors.batch')),
      );
  }

  generateComplianceReport(request: GenerateComplianceReportRequest): Observable<Blob> {
    const body: GenerateComplianceReportBody = {
      startDate: request.startDate,
      endDate: request.endDate,
      format: request.format,
      requestedBy: request.requestedBy,
    };

    return this.http
      .post(
        `${laboratoriesEndpointUrl}/${request.laboratoryId}${environment.raComplianceReportsEndpointPath}`,
        body,
        { responseType: 'blob' },
      )
      .pipe(
        catchError((err: unknown) => this.reportError(err, 'report-generator.errors.compliance')),
      );
  }

  exportEquipmentLog(request: ExportEquipmentLogRequest): Observable<Blob> {
    const body: ExportEquipmentLogBody = {
      startDate: request.startDate,
      endDate: request.endDate,
      format: request.format,
      requestedBy: request.requestedBy,
    };

    return this.http
      .post(
        `${equipmentsEndpointUrl}/${request.equipmentId}${environment.equipmentLogReportsEndpointPath}`,
        body,
        { responseType: 'blob' },
      )
      .pipe(
        catchError((err: unknown) => this.reportError(err, 'report-generator.errors.equipment')),
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
