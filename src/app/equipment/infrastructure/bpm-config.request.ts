/**
 * Represents a request used to configure a BPM parameter for a specific equipment.
 *
 * @remarks
 * This request contains the data required to define the minimum and maximum
 * acceptable values of a monitored parameter associated with an equipment.
 *
 * It is commonly used as an input structure in the presentation or application
 * layer when a user or client sends the necessary information to configure
 * BPM parameter limits.
 *
 * @example
 * ```typescript
 * const request: ConfigureBpmRequest = {
 * equipmentId: 101,
 * parameterName: 'Temperature',
 * minValue: 20,
 * maxValue: 80,
 * unit: '°C'
 * };
 * ```
 */
export interface ConfigureBpmRequest {
  /**
   * The numeric identifier of the equipment to which the BPM parameter configuration belongs.
   *
   * @remarks
   * This value links the request to a specific equipment registered in the system.
   */
  equipmentId: number;

  /**
   * The name of the parameter to be configured.
   *
   * @remarks
   * Examples of parameters may include temperature, pressure, humidity,
   * voltage, flow rate, vibration, or other measurable equipment-related values.
   */
  parameterName: string;

  /**
   * The minimum acceptable value for the configured parameter.
   *
   * @remarks
   * Values below this threshold may indicate that the equipment or process
   * is operating outside the expected range.
   */
  minValue: number;

  /**
   * The maximum acceptable value for the configured parameter.
   *
   * @remarks
   * Values above this threshold may indicate that the equipment or process
   * is operating outside the expected range.
   */
  maxValue: number;

  /**
   * The measurement unit associated with the configured parameter.
   *
   * @remarks
   * Examples include °C, bar, %, mL/min, V, A, rpm, or other engineering units.
   */
  unit: string;
}
