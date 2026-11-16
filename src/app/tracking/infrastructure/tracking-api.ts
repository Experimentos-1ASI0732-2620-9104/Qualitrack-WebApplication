import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Measurement } from '../domain/model/measurement.entity';
import { DeviceConnection } from '../domain/model/device-connection.entity';
import { ActuationEvent } from '../domain/model/actuation-event.entity';
import { ActuationRule, EnvironmentalProfile, ThresholdInput } from '../domain/model/environmental-profile.entity';
import { MonitoredMetric } from '../domain/model/monitored-metric';
import { MonitoredDevice } from '../domain/model/monitored-device.entity';
import { MonitoredEnvironment } from '../domain/model/monitored-environment.entity';
import { DeviceConnectionApiEndpoint } from './device-connection-api-endpoint';
import { MonitoredDeviceApiEndpoint } from './monitored-device-api-endpoint';
import { MonitoredEnvironmentApiEndpoint } from './monitored-environment-api-endpoint';
import { ActuationEventApiEndpoint } from './actuation-event-api-endpoint';
import { EnvironmentalProfileApiEndpoint } from './environmental-profile-api-endpoint';
import { MeasurementApiEndpoint } from './measurement-api-endpoint';
import { DeviceTarget } from './device-target';
import { TelemetryPeriod } from './telemetry-period';

/**
 * Facade responsible for providing access to Tracking & Telemetry API operations.
 *
 * This service centralizes communication with infrastructure endpoints related to:
 * - Environmental measurements.
 * - Device actuation events.
 * - Environmental profiles.
 * - IoT device connectivity status.
 *
 * It hides endpoint implementation details from the application layer,
 * allowing business logic to interact with backend capabilities through
 * a simplified and consistent API interface.
 *
 * This class acts as an abstraction boundary between application services
 * and external HTTP communication mechanisms.
 */
@Injectable({ providedIn: 'root' })
export class TrackingApi extends BaseApi {

  /**
   * Endpoint responsible for retrieving environmental measurements.
   */
  private readonly measurementEndpoint: MeasurementApiEndpoint;

  /**
   * Endpoint responsible for retrieving device actuation events.
   */
  private readonly actuationEventEndpoint: ActuationEventApiEndpoint;

  /**
   * Endpoint responsible for environmental profile operations.
   */
  private readonly profileEndpoint: EnvironmentalProfileApiEndpoint;

  /**
   * Endpoint responsible for device connectivity information.
   */
  private readonly deviceConnectionEndpoint: DeviceConnectionApiEndpoint;

  /** Reads the IoT devices of Equipment Management that Tracking follows (Anti-Corruption Layer). */
  private readonly deviceEndpoint: MonitoredDeviceApiEndpoint;

  /** Reads the environments of Laboratory Management. */
  private readonly environmentEndpoint: MonitoredEnvironmentApiEndpoint;

  /**
   * Initializes Tracking API endpoint handlers.
   *
   * Each endpoint is responsible for a specific infrastructure operation,
   * keeping HTTP communication concerns separated by responsibility.
   *
   * @param http Angular HTTP client used for external API communication.
   */
  constructor(http: HttpClient) {
    super();
    this.measurementEndpoint = new MeasurementApiEndpoint(http);
    this.actuationEventEndpoint = new ActuationEventApiEndpoint(http);
    this.profileEndpoint = new EnvironmentalProfileApiEndpoint(http);
    this.deviceConnectionEndpoint = new DeviceConnectionApiEndpoint(http);
    this.deviceEndpoint = new MonitoredDeviceApiEndpoint(http);
    this.environmentEndpoint = new MonitoredEnvironmentApiEndpoint(http);
  }

  /**
   * Retrieves the environments of the laboratory.
   *
   * @param laboratoryId Laboratory identifier.
   * @returns Observable containing the environments.
   */
  getEnvironments(laboratoryId: number): Observable<MonitoredEnvironment[]> {
    return this.environmentEndpoint.getEnvironments(laboratoryId);
  }

  /**
   * Retrieves the IoT devices located in an environment.
   *
   * @param laboratoryId Laboratory identifier.
   * @param environmentId Environment identifier.
   * @returns Observable containing the environmental device and the container monitors.
   */
  getDevices(laboratoryId: number, environmentId: number): Observable<MonitoredDevice[]> {
    return this.deviceEndpoint.getDevices(laboratoryId, environmentId);
  }

  /**
   * Retrieves telemetry measurements from an IoT device.
   *
   * Allows filtering measurements by time period and optional metric.
   *
   * @param target Device identification information.
   * @param period Time range used for telemetry retrieval.
   * @param metric Optional metric filter.
   * @returns Observable stream containing device measurements.
   */
  getMeasurements(
    target: DeviceTarget,
    period: TelemetryPeriod,
    metric?: MonitoredMetric | null,
  ): Observable<Measurement[]> {
    return this.measurementEndpoint.getMeasurements(target, period, metric);
  }

  /**
   * Retrieves actuation events generated by a container monitor.
   *
   * Provides historical information about automated or manual
   * device actions executed during a specific period.
   *
   * @param target Device identification information.
   * @param period Time range used for event retrieval.
   * @returns Observable stream containing actuation events.
   */
  getActuationEvents(target: DeviceTarget, period: TelemetryPeriod): Observable<ActuationEvent[]> {
    return this.actuationEventEndpoint.getActuationEvents(target, period);
  }

  /**
   * Retrieves the environmental profile associated with a target.
   *
   * The profile contains threshold configurations and automation rules
   * applied to the environment or monitoring device.
   *
   * @param target Device or environment identification information.
   * @returns Observable containing the profile or null when unavailable.
   */
  getProfile(target: DeviceTarget): Observable<EnvironmentalProfile | null> {
    return this.profileEndpoint.getProfile(target);
  }

  /**
   * Updates environmental threshold configurations.
   *
   * Sends new metric limits to the backend and retrieves
   * the updated environmental profile.
   *
   * @param target Target environment or device.
   * @param thresholds Threshold configurations to persist.
   * @returns Observable containing the updated profile.
   */
  updateThresholds(
    target: DeviceTarget,
    thresholds: ThresholdInput[],
  ): Observable<EnvironmentalProfile> {
    return this.profileEndpoint.updateThresholds(target, thresholds);
  }

  /**
   * Updates automatic actuation rules for a monitoring device.
   *
   * Actuation rules define automated responses triggered
   * by abnormal environmental conditions.
   *
   * @param target Target monitoring device.
   * @param rules Rules configuration to persist.
   * @returns Observable containing the updated profile.
   */
  updateActuationRules(
    target: DeviceTarget,
    rules: ActuationRule[],
  ): Observable<EnvironmentalProfile> {
    return this.profileEndpoint.updateActuationRules(target, rules);
  }

  /**
   * Retrieves the current connectivity status of an IoT device.
   *
   * This information is used to determine whether the device
   * is communicating correctly with the platform.
   *
   * @param laboratoryId Laboratory identifier.
   * @param environmentId Environment identifier.
   * @param deviceId IoT device identifier.
   * @returns Observable containing device connection information.
   */
  getDeviceConnection(
    laboratoryId: number,
    environmentId: number,
    deviceId: number,
  ): Observable<DeviceConnection> {
    return this.deviceConnectionEndpoint.getConnection(laboratoryId, environmentId, deviceId);
  }
}
