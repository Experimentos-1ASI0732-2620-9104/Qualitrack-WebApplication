import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { Equipment } from '../domain/model/equipment.entity';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { IotDeviceType } from '../domain/model/iot-device-type';

import { EquipmentApiEndpoint } from './equipment-api-endpoint';
import { BpmConfigApiEndpoint } from './bpm-config-api-endpoint';
import { MaintenanceApiEndpoint } from './maintenance-api-endpoint';

import { ChangeEquipmentStatusRequest, RegisterEquipmentRequest, RegisterIotDeviceRequest } from './equipment.request';
import { ConfigureBpmRequest } from './bpm-config.request';
import { RegisterMaintenanceRequest } from './maintenance.request';

/**
 * Infrastructure facade of the Equipment bounded context.
 *
 * @remarks
 * Equipment and IoT devices belong to a laboratory; their location, status changes and maintenance are
 * registered under the environment where they are located.
 *
 * This service groups the equipment, BPM configuration and maintenance endpoints
 * behind a single entry point for the rest of the application.
 *
 * @example
 * ```typescript
 * const api = inject(EquipmentApi);
 *
 * api.getEquipment(10).subscribe((equipment) => {
 *   console.log(equipment.length);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EquipmentApi extends BaseApi {
  /** Endpoint for equipment and IoT devices. */
  private readonly _equipmentEndpoint: EquipmentApiEndpoint;

  /** Endpoint for the BPM parameter configurations. */
  private readonly _bpmEndpoint: BpmConfigApiEndpoint;

  /** Endpoint for the maintenance records. */
  private readonly _maintenanceEndpoint: MaintenanceApiEndpoint;

  /**
   * Creates the facade and its endpoints.
   *
   * @param http - The Angular HTTP client shared by all the endpoints.
   */
  constructor(http: HttpClient) {
    super();
    this._equipmentEndpoint = new EquipmentApiEndpoint(http);
    this._bpmEndpoint = new BpmConfigApiEndpoint(http);
    this._maintenanceEndpoint = new MaintenanceApiEndpoint(http);
  }

  /**
   * Retrieves the equipment and IoT devices of a laboratory (TS32).
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @returns An observable that emits the equipment of the laboratory.
   */
  getEquipment(laboratoryId: number): Observable<Equipment[]> {
    return this._equipmentEndpoint.getEquipmentByLab(laboratoryId);
  }

  /**
   * Retrieves a single equipment of a laboratory.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param equipmentId - The identifier of the equipment.
   * @returns An observable that emits the equipment.
   */
  getEquipmentById(laboratoryId: number, equipmentId: number): Observable<Equipment> {
    return this._equipmentEndpoint.getEquipmentById(laboratoryId, equipmentId);
  }

  /**
   * Registers an equipment of the laboratory (TS31).
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param request - The data of the equipment to register.
   * @returns An observable that emits the registered equipment.
   */
  registerEquipment(laboratoryId: number, request: RegisterEquipmentRequest): Observable<Equipment> {
    return this._equipmentEndpoint.registerEquipment(laboratoryId, request);
  }

  /**
   * Registers an environmental device or container monitor (TS37, TS39).
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param deviceType - The kind of IoT device to register.
   * @param request - The data of the device to register.
   * @returns An observable that emits the registered device as an equipment.
   */
  registerDevice(laboratoryId: number, deviceType: IotDeviceType, request: RegisterIotDeviceRequest): Observable<Equipment> {
    return this._equipmentEndpoint.registerDevice(laboratoryId, deviceType, request);
  }

  /**
   * Locates an equipment in an environment (TS33); IoT devices use their own resource (TS38, TS40).
   *
   * @remarks
   * When the equipment has a device type it is located through the resource of that device type;
   * otherwise it is located as a regular equipment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the equipment will be located.
   * @param equipment - The equipment (or IoT device) to locate.
   * @returns An observable that emits the equipment once located.
   */
  assignToEnvironment(laboratoryId: number, environmentId: number, equipment: Equipment): Observable<Equipment> {
    return equipment.deviceType
      ? this._equipmentEndpoint.assignDevice(laboratoryId, environmentId, equipment.deviceType, { deviceId: equipment.id })
      : this._equipmentEndpoint.assignEquipment(laboratoryId, environmentId, { equipmentId: equipment.id });
  }

  /**
   * Registers a change of operational status (TS34).
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the equipment is located.
   * @param equipmentId - The identifier of the equipment.
   * @param request - The new status and its reason.
   * @returns An observable that completes when the change is registered.
   */
  changeStatus(laboratoryId: number, environmentId: number, equipmentId: number,
               request: ChangeEquipmentStatusRequest): Observable<void> {
    return this._equipmentEndpoint.changeStatus(laboratoryId, environmentId, equipmentId, request);
  }

  /**
   * Retrieves the BPM parameter configurations of an equipment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param equipmentId - The identifier of the equipment.
   * @returns An observable that emits the BPM parameter configurations of the equipment.
   */
  getBpmConfig(laboratoryId: number, equipmentId: number): Observable<BpmParameterConfig[]> {
    return this._bpmEndpoint.getConfigByEquipment(laboratoryId, equipmentId);
  }

  /**
   * Creates or replaces the range of a BPM parameter of an equipment.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param request - The BPM configuration to apply.
   * @returns An observable that emits the resulting BPM parameter configuration.
   */
  configureBpm(laboratoryId: number, request: ConfigureBpmRequest): Observable<BpmParameterConfig> {
    return this._bpmEndpoint.configureBpm(laboratoryId, request);
  }

  /**
   * Retrieves the maintenance history of an equipment located in the environment (TS36).
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the equipment is located.
   * @param equipmentId - The identifier of the equipment.
   * @returns An observable that emits the maintenance records of the equipment.
   */
  getMaintenanceHistory(laboratoryId: number, environmentId: number, equipmentId: number): Observable<MaintenanceRecord[]> {
    return this._maintenanceEndpoint.getMaintenanceHistory(laboratoryId, environmentId, equipmentId);
  }

  /**
   * Registers a maintenance performed on an equipment located in the environment (TS35).
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the equipment is located.
   * @param equipmentId - The identifier of the equipment.
   * @param request - The data of the maintenance to register.
   * @returns An observable that emits the registered maintenance record.
   */
  registerMaintenance(laboratoryId: number, environmentId: number, equipmentId: number,
                      request: RegisterMaintenanceRequest): Observable<MaintenanceRecord> {
    return this._maintenanceEndpoint.registerMaintenance(laboratoryId, environmentId, equipmentId, request);
  }
}
