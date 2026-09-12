import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Represents a BPM configuration resource received from or sent to the API.
 *
 * @remarks
 * This interface defines the structure of a BPM parameter configuration
 * at the infrastructure level. It is used to transfer BPM configuration data
 * between the frontend application and the backend service.
 *
 * Unlike the domain entity, this resource represents the shape of the data
 * as exposed by the API response or request mapping layer.
 *
 * @example
 * ```typescript
 * const resource: BpmConfigResource = {
 * id: 1,
 * equipmentId: 101,
 * parameterName: 'Temperature',
 * minValue: 20,
 * maxValue: 80,
 * unit: '°C',
 * createdAt: '2026-05-12T10:00:00Z'
 * };
 * ```
 */
export interface BpmConfigResource extends BaseResource {
  /**
   * The unique numeric identifier of the BPM configuration resource.
   */
  id: number;

  /**
   * The numeric identifier of the equipment associated with the BPM configuration.
   *
   * @remarks
   * This value links the BPM parameter configuration to a specific equipment
   * registered in the system.
   */
  equipmentId: number;

  /**
   * The name of the parameter being configured.
   *
   * @remarks
   * Examples may include temperature, pressure, humidity, vibration,
   * flow rate, voltage, current, or other measurable equipment variables.
   */
  parameterName: string;

  /**
   * The minimum acceptable value defined for the parameter.
   *
   * @remarks
   * Values below this limit may indicate that the equipment or process
   * is operating outside the configured range.
   */
  minValue: number;

  /**
   * The maximum acceptable value defined for the parameter.
   *
   * @remarks
   * Values above this limit may indicate that the equipment or process
   * is operating outside the configured range.
   */
  maxValue: number;

  /**
   * The measurement unit associated with the parameter.
   *
   * @remarks
   * Examples include °C, bar, %, mL/min, V, A, rpm, or other engineering units.
   */
  unit: string;

  /**
   * The creation date of the BPM configuration resource.
   *
   * @remarks
   * This value is stored as a string, commonly using ISO 8601 date format.
   */
  createdAt?: string;
}

/**
 * Represents an API response containing multiple BPM configuration resources.
 *
 * @remarks
 * This interface defines the structure of the response returned by the API
 * when retrieving BPM configurations. It contains a collection of
 * BpmConfigResource objects that can later be transformed into domain entities
 * using an assembler.
 *
 * @example
 * ```typescript
 * const response: BpmConfigsResponse = {
 * bpmConfigs: [
 * {
 * id: 1,
 * equipmentId: 101,
 * parameterName: 'Temperature',
 * minValue: 20,
 * maxValue: 80,
 * unit: '°C',
 * createdAt: '2026-05-12T10:00:00Z'
 * }
 * ]
 * };
 * ```
 */
export interface BpmConfigsResponse extends BaseResponse {
  /**
   * The collection of BPM configuration resources returned by the API.
   *
   * @remarks
   * Each item represents the configured limits and measurement unit
   * for a specific equipment parameter.
   */
  bpmConfigs: BpmConfigResource[];
}
