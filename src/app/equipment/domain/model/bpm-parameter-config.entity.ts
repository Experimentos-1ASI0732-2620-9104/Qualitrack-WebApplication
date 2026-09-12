import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a BPM parameter configuration within the equipment domain.
 *
 * @remarks
 * This entity defines the valid operating range for a specific parameter
 * associated with a piece of equipment. It is commonly used to configure
 * minimum and maximum acceptable values for monitoring, validation, or
 * process control purposes.
 *
 * In a BPM context, this configuration helps determine whether a measured
 * parameter remains within the expected limits for a given equipment.
 *
 * @example
 * ```typescript
 * const temperatureConfig = new BpmParameterConfig({
 * id: 1,
 * equipmentId: 101,
 * parameterName: 'Temperature',
 * minValue: 20,
 * maxValue: 80,
 * unit: '°C',
 * createdAt: '2026-05-12T10:00:00Z'
 * });
 *
 * console.log(temperatureConfig.parameterName); // 'Temperature'
 * ```
 */
export class BpmParameterConfig implements BaseEntity {
  /**
   * The unique numeric identifier of the BPM parameter configuration.
   */
  id: number;

  /**
   * The numeric identifier of the equipment associated with this parameter configuration.
   */
  equipmentId: number;

  /**
   * The name of the parameter being configured.
   *
   * @remarks
   * Examples of parameter names may include temperature, pressure, humidity,
   * flow rate, voltage, or any other measurable variable related to the equipment.
   */
  parameterName: string;

  /**
   * The minimum acceptable value for the configured parameter.
   *
   * @remarks
   * Values below this limit may indicate an abnormal condition or a process
   * deviation depending on the equipment and operational rules.
   */
  minValue: number;

  /**
   * The maximum acceptable value for the configured parameter.
   *
   * @remarks
   * Values above this limit may indicate an abnormal condition or a process
   * deviation depending on the equipment and operational rules.
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
   * The creation date of the parameter configuration.
   *
   * @remarks
   * This value is stored as a string, commonly using ISO 8601 date format.
   */
  createdAt: string;

  /**
   * Creates a new BPM parameter configuration entity.
   *
   * @param params - Initialization properties for the BPM parameter configuration.
   * @param params.id - The unique numeric identifier of the configuration.
   * @param params.equipmentId - The numeric identifier of the related equipment.
   * @param params.parameterName - The name of the configured parameter.
   * @param params.minValue - The minimum acceptable parameter value.
   * @param params.maxValue - The maximum acceptable parameter value.
   * @param params.unit - The measurement unit of the parameter.
   * @param params.createdAt - The creation date of the configuration.
   *
   * @remarks
   * The constructor initializes the entity with all required values.
   * Each configuration belongs to a specific equipment and defines
   * the allowed range for one monitored parameter.
   */
  constructor(params: {
    id: number;
    equipmentId: number;
    parameterName: string;
    minValue: number;
    maxValue: number;
    unit: string;
    createdAt: string;
  }) {
    this.id = params.id;
    this.equipmentId = params.equipmentId;
    this.parameterName = params.parameterName;
    this.minValue = params.minValue;
    this.maxValue = params.maxValue;
    this.unit = params.unit;
    this.createdAt = params.createdAt;
  }
}
