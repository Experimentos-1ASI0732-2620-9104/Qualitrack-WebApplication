import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { MaintenanceResource, MaintenancesResponse } from './maintenance-response';
import { MaintenanceAssembler } from './maintenance-assembler';
import { RegisterMaintenanceRequest } from './maintenance.request';

/** Base URL of the laboratories resource, built from the environment configuration. */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint for the maintenance history of an equipment located in an environment (TS35, TS36).
 *
 * @example
 * ```typescript
 * const endpoint = new MaintenanceApiEndpoint(http);
 *
 * endpoint.getMaintenanceHistory(10, 5, 101).subscribe((records) => {
 *   console.log(records.length);
 * });
 * ```
 */
export class MaintenanceApiEndpoint extends BaseApiEndpoint<
  MaintenanceRecord,
  MaintenanceResource,
  MaintenancesResponse,
  MaintenanceAssembler
> {
  /**
   * Creates a new maintenance endpoint.
   *
   * @param http - The Angular HTTP client used to perform the requests.
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new MaintenanceAssembler());
  }

  /**
   * Retrieves the maintenance history of an equipment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the equipment is located.
   * @param equipmentId - The identifier of the equipment.
   * @returns An observable that emits the maintenance records of the equipment.
   */
  getMaintenanceHistory(laboratoryId: number, environmentId: number, equipmentId: number): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceResource[]>(this.records(laboratoryId, environmentId, equipmentId)).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError(`Failed to fetch maintenance history for equipment ${equipmentId}`)),
    );
  }

  /**
   * Registers a maintenance performed on an equipment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the equipment is located.
   * @param equipmentId - The identifier of the equipment.
   * @param request - The data of the maintenance to register.
   * @returns An observable that emits the registered maintenance record.
   */
  registerMaintenance(laboratoryId: number, environmentId: number, equipmentId: number,
                      request: RegisterMaintenanceRequest): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceResource>(this.records(laboratoryId, environmentId, equipmentId), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register maintenance record')),
    );
  }

  /**
   * Builds the URL of the maintenance records of an equipment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the equipment is located.
   * @param equipmentId - The identifier of the equipment.
   * @returns The URL of the maintenance records of the equipment.
   */
  private records(laboratoryId: number, environmentId: number, equipmentId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`
      + `${environment.equipmentEndpointPath}/${equipmentId}${environment.equipmentMaintenanceEndpointPath}`;
  }
}
