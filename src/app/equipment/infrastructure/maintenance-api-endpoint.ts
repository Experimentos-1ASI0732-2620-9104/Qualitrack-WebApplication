import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { MaintenanceResource, MaintenancesResponse } from './maintenance-response';
import { MaintenanceAssembler } from './maintenance-assembler';
import { RegisterMaintenanceRequest } from './maintenance.request';
import { MessageResource } from '../../shared/infrastructure/message-response';

const equipmentEndpointUrl = `${environment.serverBasePath}${environment.equipmentEndpointPath}`;

export class MaintenanceApiEndpoint extends BaseApiEndpoint<
  MaintenanceRecord,
  MaintenanceResource,
  MaintenancesResponse,
  MaintenanceAssembler
> {
  constructor(http: HttpClient) {
    super(http, equipmentEndpointUrl, new MaintenanceAssembler());
  }

  getMaintenanceHistory(equipmentId: number): Observable<MaintenanceRecord[]> {
    return this.http
      .get<
        MaintenanceResource[]
      >(`${this.endpointUrl}/${equipmentId}${environment.equipmentMaintenanceEndpointPath}`)
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(
          this.handleError(`Failed to fetch maintenance history for equipment ${equipmentId}`),
        ),
      );
  }

  registerMaintenance(request: RegisterMaintenanceRequest): Observable<MessageResource> {
    const { equipmentId, ...body } = request;

    return this.http
      .post<MessageResource>(
        `${this.endpointUrl}/${equipmentId}${environment.equipmentMaintenanceEndpointPath}`,
        body,
      )
      .pipe(catchError(this.handleError('Failed to register maintenance record')));
  }
}
