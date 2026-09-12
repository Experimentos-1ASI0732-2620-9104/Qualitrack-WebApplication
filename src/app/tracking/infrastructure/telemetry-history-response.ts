import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a historical telemetry point for API communication.
 *
 * @remarks
 * In DDD, this resource belongs to the infrastructure layer and represents a
 * historical telemetry record as transferred through the REST API. It is later
 * converted into a domain entity by the corresponding assembler.
 */
export interface TelemetryHistoryPointResource extends BaseResource {
  /**
   * The unique numeric identifier of the historical telemetry point resource.
   */
  id: number;

  /**
   * The numeric identifier of the equipment that generated this telemetry point.
   */
  equipmentId: number;

  /**
   * The monitored parameter name, such as Temperature, Humidity, or Pressure.
   */
  parameterName: string;

  /**
   * The recorded telemetry value at the specific timestamp.
   */
  recordedValue: number;

  /**
   * The exact timestamp when this telemetry point was recorded.
   */
  timestamp: string;

  /**
   * Indicates whether this telemetry point was detected as an anomaly.
   */
  isAnomaly: boolean;

  /**
   * The timestamp when this historical telemetry point was created in the system.
   */
  createdAt: string;
}

/**
 * Response envelope for historical telemetry queries.
 *
 * @remarks
 * This response groups historical telemetry points under a consistent property,
 * allowing the assembler to convert API responses into domain entities.
 */
export interface TelemetryHistoryResponse extends BaseResponse {
  /**
   * Array of historical telemetry point resources returned by the API.
   */
  historyPoints: TelemetryHistoryPointResource[];
}
