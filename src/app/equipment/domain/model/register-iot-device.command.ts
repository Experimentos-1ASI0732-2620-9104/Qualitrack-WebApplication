import { IotDeviceType } from './iot-device-type';

/**
 * Command to register an ESP32 device with the identity Edge uses to recognise it (US51, US53).
 *
 * @remarks
 * This command only carries the input data of the use case; it is not a domain entity.
 *
 * @example
 * ```typescript
 * const command: RegisterIotDeviceCommand = {
 *   deviceType: 'CONTAINER_MONITOR',
 *   name: 'Container monitor 1',
 *   sensorExternalId: 'esp32-container-001',
 *   serialNumber: 'AA:BB:CC:DD:EE:FF',
 *   model: 'ESP32-DevKit',
 *   firmwareVersion: '1.0.0'
 * };
 * ```
 */
export interface RegisterIotDeviceCommand {
  /**
   * The kind of IoT device being registered.
   */
  deviceType: IotDeviceType;

  /**
   * The display name of the device.
   */
  name: string;

  /**
   * The unique identifier with which Edge recognises the device.
   */
  sensorExternalId: string;

  /**
   * The MAC address or serial number of the device.
   */
  serialNumber: string;

  /**
   * The model of the device.
   */
  model: string;

  /**
   * The firmware version installed on the device, or `null` if unknown.
   */
  firmwareVersion: string | null;
}
