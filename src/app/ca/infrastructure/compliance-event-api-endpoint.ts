import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { ComplianceEvent } from '../domain/model/compliance-event.entity';
import { ComplianceEventResource, ComplianceEventsResponse } from './compliance-event-response';
import { ComplianceEventAssembler } from './compliance-event-assembler';

const apiBaseUrl = environment.serverBasePath;

export class ComplianceEventApiEndpoint extends BaseApiEndpoint<
  ComplianceEvent,
  ComplianceEventResource,
  ComplianceEventsResponse,
  ComplianceEventAssembler
> {
  constructor(http: HttpClient) {
    super(http, apiBaseUrl, new ComplianceEventAssembler());
  }

  getEquipmentEvents(equipmentId: number): Observable<ComplianceEvent[]> {
    return this.http
      .get<
        ComplianceEventResource[]
      >(`${this.endpointUrl}${environment.equipmentEndpointPath}/${equipmentId}${environment.equipmentComplianceEventsEndpointPath}`)
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResources(resources)),
        catchError(
          this.handleError(`Failed to fetch compliance events for equipment ${equipmentId}`),
        ),
      );
  }

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
