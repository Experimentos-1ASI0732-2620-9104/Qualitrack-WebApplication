import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Equipment } from '../domain/model/equipment.entity';
import { IotDeviceType } from '../domain/model/iot-device-type';
import { EquipmentResource, EquipmentsResponse } from './equipment-response';
import { EquipmentAssembler } from './equipment-assembler';
import {
  AssignDeviceRequest,
  AssignEquipmentRequest,
  ChangeEquipmentStatusRequest,
  RegisterEquipmentRequest,
  RegisterIotDeviceRequest,
} from './equipment.request';

/** Base URL of the laboratories resource, built from the environment configuration. */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/** Path segment of each IoT device type, used to register and to associate devices. */
const devicePaths: Record<IotDeviceType, string> = {
  ENVIRONMENTAL_DEVICE: environment.environmentalDevicesEndpointPath,
  CONTAINER_MONITOR: environment.containerMonitorsEndpointPath,
};

/**
 * HTTP endpoint for the equipment and IoT devices of a laboratory (TS31-TS34, TS37-TS40).
 *
 * @remarks
 * Equipment is registered under `/laboratories/{laboratoryId}`; its location and status changes are
 * registered under the environment where it is located.
 *
 * @example
 * ```typescript
 * const endpoint = new EquipmentApiEndpoint(http);
 *
 * endpoint.getEquipmentByLab(10).subscribe((equipment) => {
 *   console.log(equipment.length);
 * });
 * ```
 */
export class EquipmentApiEndpoint extends BaseApiEndpoint<
  Equipment,
  EquipmentResource,
  EquipmentsResponse,
  EquipmentAssembler
> {
  /**
   * Creates a new equipment endpoint.
   *
   * @param http - The Angular HTTP client used to perform the requests.
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new EquipmentAssembler());
  }

  /**
   * Retrieves the equipment and IoT devices of a laboratory.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @returns An observable that emits the equipment of the laboratory.
   */
  getEquipmentByLab(laboratoryId: number): Observable<Equipment[]> {
    return this.http.get<EquipmentResource[]>(this.equipment(laboratoryId)).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError(`Failed to fetch equipment of laboratory ${laboratoryId}`)),
    );
  }

  /**
   * Retrieves a single equipment of a laboratory.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param equipmentId - The identifier of the equipment.
   * @returns An observable that emits the equipment.
   */
  getEquipmentById(laboratoryId: number, equipmentId: number): Observable<Equipment> {
    return this.http.get<EquipmentResource>(`${this.equipment(laboratoryId)}/${equipmentId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch equipment ${equipmentId}`)),
    );
  }

  /**
   * Registers an equipment in a laboratory.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param request - The data of the equipment to register.
   * @returns An observable that emits the registered equipment.
   */
  registerEquipment(laboratoryId: number, request: RegisterEquipmentRequest): Observable<Equipment> {
    return this.http.post<EquipmentResource>(this.equipment(laboratoryId), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register equipment')),
    );
  }

  /**
   * Registers an IoT device in a laboratory.
   *
   * @remarks
   * The URL depends on the device type: each type has its own path segment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param deviceType - The kind of IoT device to register.
   * @param request - The data of the device to register.
   * @returns An observable that emits the registered device as an equipment.
   */
  registerDevice(laboratoryId: number, deviceType: IotDeviceType, request: RegisterIotDeviceRequest): Observable<Equipment> {
    const url = `${this.endpointUrl}/${laboratoryId}${environment.devicesEndpointPath}${devicePaths[deviceType]}`;
    return this.http.post<EquipmentResource>(url, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register IoT device')),
    );
  }

  /**
   * Locates an equipment in an environment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment.
   * @param request - The equipment to locate in the environment.
   * @returns An observable that emits the equipment once located.
   */
  assignEquipment(laboratoryId: number, environmentId: number, request: AssignEquipmentRequest): Observable<Equipment> {
    return this.http.post<EquipmentResource>(this.environmentEquipment(laboratoryId, environmentId), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to associate equipment with the environment')),
    );
  }

  /**
   * Locates an IoT device in an environment.
   *
   * @remarks
   * The URL depends on the device type: each type has its own path segment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment.
   * @param deviceType - The kind of IoT device to locate.
   * @param request - The device to locate in the environment.
   * @returns An observable that emits the device once located.
   */
  assignDevice(laboratoryId: number, environmentId: number, deviceType: IotDeviceType, request: AssignDeviceRequest): Observable<Equipment> {
    const url = `${this.environment(laboratoryId, environmentId)}${devicePaths[deviceType]}`;
    return this.http.post<EquipmentResource>(url, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to associate IoT device with the environment')),
    );
  }

  /**
   * Registers a change of operational status of an equipment located in an environment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the equipment is located.
   * @param equipmentId - The identifier of the equipment.
   * @param request - The new status and its reason.
   * @returns An observable that completes when the change is registered.
   */
  changeStatus(laboratoryId: number, environmentId: number, equipmentId: number, request: ChangeEquipmentStatusRequest): Observable<void> {
    const url = `${this.environmentEquipment(laboratoryId, environmentId)}/${equipmentId}${environment.equipmentStatusChangesEndpointPath}`;
    return this.http.post<unknown>(url, request).pipe(
      map(() => undefined),
      catchError(this.handleError('Failed to register status change')),
    );
  }

  /**
   * Builds the URL of the equipment collection of a laboratory.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @returns The URL of the equipment of the laboratory.
   */
  private equipment(laboratoryId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.equipmentEndpointPath}`;
  }

  /**
   * Builds the URL of an environment of a laboratory.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment.
   * @returns The URL of the environment.
   */
  private environment(laboratoryId: number, environmentId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`;
  }

  /**
   * Builds the URL of the equipment collection of an environment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment.
   * @returns The URL of the equipment located in the environment.
   */
  private environmentEquipment(laboratoryId: number, environmentId: number): string {
    return `${this.environment(laboratoryId, environmentId)}${environment.equipmentEndpointPath}`;
  }
}
