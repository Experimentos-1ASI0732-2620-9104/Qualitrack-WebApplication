/**
 * Represents a command used to configure a BPM parameter for a specific equipment.
 *
 * @remarks
 * This command contains the required data to define the acceptable operating
 * range of a parameter associated with an equipment. It is typically used
 * in the application layer to request the creation or registration of a BPM
 * parameter configuration.
 *
 * The command does not represent a domain entity by itself. Instead, it carries
 * the input data needed to execute a use case related to BPM parameter setup.
 *
 * @example
 * ```typescript
 * const command: ConfigureBpmCommand = {
 * equipmentId: 101,
 * parameterName: 'Temperature',
 * minValue: 20,
 * maxValue: 80,
 * unit: '°C'
 * };
 * ```
 */
export interface ConfigureBpmCommand {
  /**
   * The numeric identifier of the equipment to which the BPM parameter configuration belongs.
   *
   * @remarks
   * This value links the configuration request to a specific equipment registered
   * in the system.
   */
  equipmentId: number;

  /**
   * The name of the parameter to be configured.
   *
   * @remarks
   * Examples of parameters may include temperature, pressure, humidity,
   * voltage, flow rate, or other measurable equipment-related variables.
   */
  parameterName: string;

  /**
   * The minimum acceptable value for the configured parameter.
   *
   * @remarks
   * Values below this threshold may indicate that the equipment is operating
   * outside the expected range.
   */
  minValue: number;

  /**
   * The maximum acceptable value for the configured parameter.
   *
   * @remarks
   * Values above this threshold may indicate that the equipment is operating
   * outside the expected range.
   */
  maxValue: number;

  /**
   * The measurement unit associated with the parameter.
   *
   * @remarks
   * Examples include °C, bar, %, mL/min, V, A, rpm, or other engineering units.
   */
  unit: string;
}
