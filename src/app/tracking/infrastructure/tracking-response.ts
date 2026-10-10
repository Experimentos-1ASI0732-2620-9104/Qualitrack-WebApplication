import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Represents a telemetry measurement resource returned by the backend API.
 *
 * This interface defines the external data contract used to transfer
 * sensor readings from IoT devices into the application infrastructure layer.
 *
 * The resource contains measurement information required for environmental
 * monitoring, including metric value, evaluation state and applied profile version.
 */
export interface MeasurementResource extends BaseResource {
  id: number;
  deviceId: number;
  environmentId: number | null;
  metric: string;
  value: number | null;
  textValue: string | null;
  unit: string;
  measuredAt: string;
  state: string | null;
  thresholdValue: number | null;
  profileVersion: number | null;
}

/**
 * Represents the API response containing multiple telemetry measurements.
 */
export interface MeasurementsResponse extends BaseResponse {

  /**
   * Collection of measurement resources returned by the backend.
   */
  measurements: MeasurementResource[];
}

/**
 * Represents an actuation event resource returned by the backend API.
 *
 * Contains information about actions executed by IoT actuators,
 * including the triggering environmental condition and execution result.
 */
export interface ActuationEventResource extends BaseResource {
  id: number;
  deviceId: number;
  environmentId: number;
  action: string;
  triggerMetric: string | null;
  triggerState: string | null;
  result: string;
  occurredAt: string;
  profileVersion: number | null;
}

/**
 * Represents the API response containing actuation history.
 */
export interface ActuationEventsResponse extends BaseResponse {
  actuationEvents: ActuationEventResource[];
}

/**
 * Represents threshold configuration data received from the backend.
 *
 * Threshold resources define environmental limits used to evaluate
 * monitored metrics.
 */
export interface ThresholdResource {
  metric: string;
  unit?: string;
  normalMin: number | null;
  normalMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
}

/**
 * Represents an actuation rule configuration received from the backend.
 *
 * Defines the relationship between an environmental condition
 * and the actuator action that must be executed.
 */
export interface ActuationRuleResource {
  metric: string;
  state: string;
  action: string;
}

/**
 * Represents an environmental profile resource returned by the backend API.
 *
 * The profile contains the active configuration applied to an environment
 * or monitoring device, including thresholds and automatic actuation rules.
 *
 * This resource is transformed into an EnvironmentalProfile domain entity
 * by the infrastructure assembler layer.
 */
export interface EnvironmentalProfileResource extends BaseResource {
  id: number;
  scope: string;
  laboratoryId: number;
  environmentId: number | null;
  deviceId: number | null;
  version: number;
  thresholds: ThresholdResource[];
  actuationRules: ActuationRuleResource[];
  updatedAt: string | null;
  updatedBy: number | null;
}

/**
 * Represents the API response containing environmental profiles.
 */
export interface EnvironmentalProfilesResponse extends BaseResponse {
  profiles: EnvironmentalProfileResource[];
}
