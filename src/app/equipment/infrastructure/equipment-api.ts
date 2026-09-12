import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { Equipment } from '../domain/model/equipment.entity';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';

import { EquipmentApiEndpoint } from './equipment-api-endpoint';
import { BpmConfigApiEndpoint } from './bpm-config-api-endpoint';
import { MaintenanceApiEndpoint } from './maintenance-api-endpoint';

import { RegisterEquipmentRequest } from './equipment.request';
import { ConfigureBpmRequest } from './bpm-config.request';
import { RegisterMaintenanceRequest } from './maintenance.request';
import { MessageResource } from '../../shared/infrastructure/message-response';

/**
 * Facade service for equipment-related API operations.
 *
 * @remarks
 * This service acts as the main access point for the equipment module at the
 * infrastructure level. It centralizes operations related to equipment
 * registration, BPM parameter configuration, and maintenance history.
 *
 * Instead of exposing each API endpoint directly to the rest of the application,
 * this class coordinates the different endpoint classes and provides a simpler
 * interface for consuming equipment-related use cases.
 */
@Injectable({ providedIn: 'root' })
export class EquipmentApi extends BaseApi {
  /**
   * API endpoint responsible for equipment registration and retrieval.
   */
  private readonly _equipmentEndpoint: EquipmentApiEndpoint;

  /**
   * API endpoint responsible for BPM parameter configuration.
   */
  private readonly _bpmEndpoint: BpmConfigApiEndpoint;

  /**
   * API endpoint responsible for maintenance records.
   */
  private readonly _maintenanceEndpoint: MaintenanceApiEndpoint;

  /**
   * Creates a new EquipmentApi service instance.
   *
   * @param http - Angular HttpClient used to initialize the equipment,
   * BPM configuration, and maintenance API endpoints.
   */
  constructor(http: HttpClient) {
    super();
    this._equipmentEndpoint = new EquipmentApiEndpoint(http);
    this._bpmEndpoint = new BpmConfigApiEndpoint(http);
    this._maintenanceEndpoint = new MaintenanceApiEndpoint(http);
  }

  /**
   * Retrieves the equipment registered in a specific laboratory.
   *
   * @param labId - The numeric identifier of the laboratory
   * @returns An Observable containing a list of Equipment entities
   */
  getEquipment(labId: number): Observable<Equipment[]> {
    return this._equipmentEndpoint.getEquipmentByLab(labId);
  }

  /**
   * Retrieves a specific equipment by its numeric identifier.
   *
   * @param equipmentId - The numeric identifier of the equipment
   * @returns An Observable containing the Equipment entity
   *
   * @remarks
   * This method supports direct navigation to equipment detail views where the
   * equipment list may not have been loaded previously.
   */
  getEquipmentById(equipmentId: number): Observable<Equipment> {
    return this._equipmentEndpoint.getEquipmentById(equipmentId);
  }

  /**
   * Registers a new equipment in the system.
   *
   * @param request - The request data required to register the equipment
   * @returns An Observable containing the registered Equipment entity
   */
  registerEquipment(request: RegisterEquipmentRequest): Observable<Equipment> {
    return this._equipmentEndpoint.registerEquipment(request);
  }

  /**
   * Retrieves the BPM parameter configuration for a specific equipment.
   *
   * @param equipmentId - The numeric identifier of the equipment
   * @returns An Observable containing a list of BpmParameterConfig entities
   */
  getBpmConfig(equipmentId: number): Observable<BpmParameterConfig[]> {
    return this._bpmEndpoint.getConfigByEquipment(equipmentId);
  }

  /**
   * Configures BPM parameter limits for an equipment.
   *
   * @param request - The request data required to configure BPM parameters
   * @returns An Observable containing a message resource
   */
  configureBpm(request: ConfigureBpmRequest): Observable<MessageResource> {
    return this._bpmEndpoint.configureBpm(request);
  }

  /**
   * Retrieves the maintenance history of a specific equipment.
   *
   * @param equipmentId - The numeric identifier of the equipment
   * @returns An Observable containing a list of MaintenanceRecord entities
   */
  getMaintenanceHistory(equipmentId: number): Observable<MaintenanceRecord[]> {
    return this._maintenanceEndpoint.getMaintenanceHistory(equipmentId);
  }

  /**
   * Registers a new maintenance activity for an equipment.
   *
   * @param request - The request data required to register the maintenance record
   * @returns An Observable containing a message resource
   */
  registerMaintenance(request: RegisterMaintenanceRequest): Observable<MessageResource> {
    return this._maintenanceEndpoint.registerMaintenance(request);
  }
}
