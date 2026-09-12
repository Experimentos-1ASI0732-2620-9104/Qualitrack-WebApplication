/**
 * Represents a command used to link an external sensor to a specific equipment.
 *
 * @remarks
 * This command contains the required data to associate a sensor with an
 * equipment registered in the system. It is typically used in the application
 * layer to request the linking of a physical or external sensor device.
 *
 * The command does not represent a domain entity by itself. Instead, it carries
 * the input data needed to execute a use case related to equipment sensor
 * integration.
 *
 * @example
 * ```typescript
 * const command: LinkSensorCommand = {
 * equipmentId: 101,
 * sensorExternalId: 'sensor-ext-001',
 * sensorType: 'Temperature'
 * };
 * ```
 */
export interface LinkSensorCommand {
  /**
   * The numeric identifier of the equipment to which the sensor will be linked.
   *
   * @remarks
   * This value references the equipment registered in the system and allows
   * the sensor association to be tracked correctly.
   */
  equipmentId: number;

  /**
   * The external identifier of the sensor.
   *
   * @remarks
   * This value usually comes from an external monitoring system, IoT platform,
   * sensor gateway, or hardware device. It is used to recognize the sensor
   * outside the internal system.
   */
  sensorExternalId: string;

  /**
   * The type of sensor being linked to the equipment.
   *
   * @remarks
   * Examples of sensor types may include temperature, pressure, humidity,
   * vibration, flow, voltage, current, or other measurable variables depending
   * on the equipment and monitoring requirements.
   */
  sensorType: string;
}
