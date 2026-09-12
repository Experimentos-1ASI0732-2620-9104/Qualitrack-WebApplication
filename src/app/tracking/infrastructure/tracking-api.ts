import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Measurement } from '../domain/model/measurement.entity';
import { EquipmentStatus } from '../domain/model/equipment-status.entity';
import { TelemetryHistoryPoint } from '../domain/model/telemetry-history-point.entity';

import { MeasurementApiEndpoint } from './measurement-api-endpoint';
import { EquipmentStatusApiEndpoint } from './equipment-status-api-endpoint';
import { TelemetryHistoryApiEndpoint } from './telemetry-history-api-endpoint';

/**
 * Facade service for Tracking infrastructure API operations.
 *
 * @remarks
 * This service centralizes access to the Tracking bounded context endpoints.
 * It hides endpoint-specific details from the application store and provides
 * a clean API for telemetry measurements, equipment status, and historical data.
 */
@Injectable({ providedIn: 'root' })
export class TrackingApi {
  /**
   * Endpoint client for telemetry measurement operations.
   */
  private readonly measurementEndpoint: MeasurementApiEndpoint;

  /**
   * Endpoint client for equipment status operations.
   */
  private readonly equipmentStatusEndpoint: EquipmentStatusApiEndpoint;

  /**
   * Endpoint client for telemetry history operations.
   */
  private readonly telemetryHistoryEndpoint: TelemetryHistoryApiEndpoint;

  /**
   * Creates a new TrackingApi facade.
   *
   * @param http - Angular HttpClient used by the internal endpoint clients
   */
  constructor(private readonly http: HttpClient) {
    this.measurementEndpoint = new MeasurementApiEndpoint(this.http);
    this.equipmentStatusEndpoint = new EquipmentStatusApiEndpoint(this.http);
    this.telemetryHistoryEndpoint = new TelemetryHistoryApiEndpoint(this.http);
  }

  /**
   * Retrieves the latest telemetry measurements.
   *
   * @param equipmentId - Optional numeric equipment identifier used for filtering
   * @returns Observable stream emitting Measurement domain entities
   */
  getLatestMeasurements(equipmentId: number): Observable<Measurement[]> {
    return this.measurementEndpoint.getLatestMeasurements(equipmentId);
  }

  /**
   * Retrieves the current telemetry status for a specific equipment.
   *
   * @param equipmentId - Numeric identifier of the equipment
   * @returns Observable stream emitting the current EquipmentStatus
   */
  getEquipmentStatus(equipmentId: number): Observable<EquipmentStatus | null> {
    return this.equipmentStatusEndpoint.getStatusByEquipment(equipmentId);
  }

  /**
   * Retrieves historical telemetry points using optional filters.
   *
   * @param filters - Optional telemetry history filters
   * @returns Observable stream emitting TelemetryHistoryPoint domain entities
   */
  getTelemetryHistory(filters: {
    equipmentId: number;
    from?: string;
    to?: string;
  }): Observable<TelemetryHistoryPoint[]> {
    return this.telemetryHistoryEndpoint.getTelemetryHistory(filters);
  }
}
