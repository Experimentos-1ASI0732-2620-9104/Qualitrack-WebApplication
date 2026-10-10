import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { ComplianceEvent } from '../domain/model/compliance-event.entity';
import { ComplianceEventResource, ComplianceEventsResponse } from './compliance-event-response';
import { ComplianceEventAssembler } from './compliance-event-assembler';

const apiBaseUrl = environment.serverBasePath;

/**
 * HTTP client of the compliance events (audit trail) of an equipment or of a batch.
 *
 * @remarks
 * Every method fails with an `ApiError` that keeps the HTTP status and the details sent by the server.
 */
export class ComplianceEventApiEndpoint extends BaseApiEndpoint<
  ComplianceEvent,
  ComplianceEventResource,
  ComplianceEventsResponse,
  ComplianceEventAssembler
> {
  /**
   * Creates the endpoint client.
   *
   * @param http - Angular HttpClient used for the requests
   */
  constructor(http: HttpClient) {
    super(http, apiBaseUrl, new ComplianceEventAssembler());
  }

  /**
   * Retrieves the compliance events of an equipment of a laboratory.
   *
   * @param laboratoryId - The laboratory of the equipment
   * @param equipmentId - The unique numeric identifier of the equipment
   * @returns Observable emitting the compliance events of the equipment
   */
  getEquipmentEvents(laboratoryId: number, equipmentId: number): Observable<ComplianceEvent[]> {
    return this.http
      .get<
        ComplianceEventResource[]
      >(`${this.endpointUrl}${environment.laboratoryLabsEndpointPath}/${laboratoryId}${environment.equipmentEndpointPath}/${equipmentId}${environment.equipmentComplianceEventsEndpointPath}`)
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResources(resources)),
        catchError(
          this.handleError(`Failed to fetch compliance events for equipment ${equipmentId}`),
        ),
      );
  }

  /**
   * Retrieves the compliance events of a batch.
   *
   * @param batchId - The unique numeric identifier of the batch
   * @returns Observable emitting the compliance events of the batch
   */
  getBatchEvents(batchId: number): Observable<ComplianceEvent[]> {
    return this.http
      .get<
        ComplianceEventResource[]
      >(`${this.endpointUrl}${environment.batchEndpointPath}/${batchId}${environment.batchComplianceEventsEndpointPath}`)
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResources(resources)),
        catchError(this.handleError(`Failed to fetch compliance events for batch ${batchId}`)),
      );
  }
}
