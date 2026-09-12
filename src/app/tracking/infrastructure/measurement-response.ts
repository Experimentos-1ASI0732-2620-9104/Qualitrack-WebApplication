import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a telemetry measurement for API communication.
 *
 * @remarks
 * In DDD, this resource belongs to the infrastructure layer and represents
 * the shape of telemetry measurement data received from or sent to the REST API.
 * It does not contain domain behavior; it only defines the transport contract.
 */
export interface MeasurementResource extends BaseResource {
  /**
   * The unique numeric identifier of the measurement resource.
   */
  id: number;

  /**
   * The numeric identifier of the equipment that produced this measurement.
   */
  equipmentId: number;

  /**
   * The monitored parameter name, such as Temperature, Humidity, or Pressure.
   */
  parameterName: string;

  /**
   * The measured telemetry value.
   */
  value: number;

  /**
   * The unit of measurement for the telemetry value.
   */
  unit: string;

  /**
   * The exact timestamp when the measurement was recorded.
   */
  timestamp: string;

  /**
   * The timestamp when this measurement resource was created in the system.
   */
  createdAt: string;
}

/**
 * Response envelope for telemetry measurement collection queries.
 *
 * @remarks
 * This response groups multiple telemetry measurement resources under a
 * consistent property. The assembler uses this envelope to convert API data
 * into domain entities.
 */
export interface MeasurementsResponse extends BaseResponse {
  /**
   * Array of telemetry measurement resources returned by the API.
   */
  measurements: MeasurementResource[];
}
