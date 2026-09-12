import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { AuditLogEntry } from '../domain/model/audit-log-entry.entity';
import { AuditLogEntryResource, AuditLogEntriesResponse } from './audit-log-response';
import { AuditLogAssembler } from './audit-log-assembler';

const apiBaseUrl = environment.serverBasePath;

/**
 * HTTP endpoint client for audit log operations.
 *
 * @remarks
 * Audit logs are exposed as nested resources. Equipment audit logs are queried
 * from `/equipments/{equipmentId}/audit-logs`, while batch audit logs are queried
 * from `/batches/{batchId}/audit-logs`.
 */
export class AuditLogApiEndpoint extends BaseApiEndpoint<
  AuditLogEntry,
  AuditLogEntryResource,
  AuditLogEntriesResponse,
  AuditLogAssembler
> {
  constructor(http: HttpClient) {
    super(http, apiBaseUrl, new AuditLogAssembler());
  }

  getAuditLog(filters?: {
    equipmentId?: number;
    batchId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<AuditLogEntry[]> {
    if (!filters?.equipmentId && !filters?.batchId) {
      return of([]);
    }

    let params = new HttpParams();

    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }

    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    const endpointUrl = filters.equipmentId
      ? `${this.endpointUrl}${environment.equipmentEndpointPath}/${filters.equipmentId}${environment.equipmentAuditLogsEndpointPath}`
      : `${this.endpointUrl}${environment.batchEndpointPath}/${filters.batchId}${environment.batchAuditLogsEndpointPath}`;

    return this.http.get<AuditLogEntryResource[]>(endpointUrl, { params }).pipe(
      map((resources) => this.assembler.toEntitiesFromResources(resources)),
      catchError(this.handleError('Failed to fetch audit logs')),
    );
  }
}
