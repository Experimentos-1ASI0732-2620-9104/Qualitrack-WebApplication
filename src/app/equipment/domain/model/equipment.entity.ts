import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EquipmentStatus } from './equipment-status';
import { IotDeviceType } from './iot-device-type';

/**
 * Equipment registered in a laboratory (US45, US46).
 *
 * @remarks
 * An IoT device is an equipment with a device type and the identity Edge uses to recognise it;
 * only IoT devices send telemetry and appear in the tracking views. Equipment is located in one
 * environment of the laboratory once it is associated with it (US47).
 *
 * @example
 * ```typescript
 * const equipment = new Equipment({
 *   id: 1,
 *   labId: 10,
 *   environmentId: null,
 *   name: 'Environmental monitor',
 *   type: 'Sensor',
 *   model: 'ESP32-DevKit',
 *   serialNumber: 'SN-0001',
 *   status: 'OPERATIONAL',
 *   deviceType: 'ENVIRONMENTAL_DEVICE',
 *   sensorExternalId: 'esp32-lab-001',
 *   firmwareVersion: '1.0.0',
 *   createdAt: '2026-05-12T10:00:00Z'
 * });
 *
 * console.log(equipment.isIotDevice); // true
 * console.log(equipment.isLocated); // false
 * ```
 */
export class Equipment implements BaseEntity {
  /**
   * The unique numeric identifier of the equipment.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory where the equipment is registered.
   */
  labId: number;

  /**
   * The numeric identifier of the environment where the equipment is located.
   *
   * @remarks
   * It is `null` until the equipment is associated with an environment.
   */
  environmentId: number | null;

  /**
   * The display name of the equipment.
   */
  name: string;

  /**
   * The type or category of the equipment.
   */
  type: string;

  /**
   * The model of the equipment.
   */
  model: string;

  /**
   * The serial number of the equipment.
   *
   * @remarks
   * For IoT devices, this may be a MAC address or a serial number.
   */
  serialNumber: string;

  /**
   * The current operational status of the equipment.
   */
  status: EquipmentStatus;

  /**
   * The IoT device type of the equipment.
   *
   * @remarks
   * It is `null` for equipment that sends no telemetry.
   */
  deviceType: IotDeviceType | null;

  /**
   * The identifier with which Edge recognises the device.
   *
   * @remarks
   * It is `null` for equipment that is not an IoT device.
   */
  sensorExternalId: string | null;

  /**
   * The firmware version installed on the device, or `null` if unknown or not applicable.
   */
  firmwareVersion: string | null;

  /**
   * The creation date of the equipment record.
   *
   * @remarks
   * This value is stored as a string, commonly using ISO 8601 date format.
   */
  createdAt: string;

  /**
   * Creates a new Equipment entity.
   *
   * @param params - Initialization properties for the equipment.
   * @param params.id - The unique numeric identifier of the equipment.
   * @param params.labId - The identifier of the laboratory where the equipment is registered.
   * @param params.environmentId - The identifier of the environment where the equipment is located, or `null` if it is not located yet.
   * @param params.name - The display name of the equipment.
   * @param params.type - The type or category of the equipment.
   * @param params.model - The model of the equipment.
   * @param params.serialNumber - The serial number of the equipment.
   * @param params.status - The current operational status.
   * @param params.deviceType - The IoT device type, or `null` if the equipment sends no telemetry.
   * @param params.sensorExternalId - The identifier with which Edge recognises the device, or `null`.
   * @param params.firmwareVersion - The firmware version, or `null`.
   * @param params.createdAt - The creation date of the equipment record.
   */
  constructor(params: {
    id: number;
    labId: number;
    environmentId: number | null;
    name: string;
    type: string;
    model: string;
    serialNumber: string;
    status: EquipmentStatus;
    deviceType: IotDeviceType | null;
    sensorExternalId: string | null;
    firmwareVersion: string | null;
    createdAt: string;
  }) {
    this.id = params.id;
    this.labId = params.labId;
    this.environmentId = params.environmentId;
    this.name = params.name;
    this.type = params.type;
    this.model = params.model;
    this.serialNumber = params.serialNumber;
    this.status = params.status;
    this.deviceType = params.deviceType;
    this.sensorExternalId = params.sensorExternalId;
    this.firmwareVersion = params.firmwareVersion;
    this.createdAt = params.createdAt;
  }

  /**
   * Whether the equipment is an IoT device that communicates with Edge.
   *
   * @returns `true` if the equipment has a device type; otherwise `false`.
   */
  get isIotDevice(): boolean {
    return this.deviceType !== null;
  }

  /**
   * Whether the equipment is already located in an environment.
   *
   * @returns `true` if the equipment has an associated environment; otherwise `false`.
   */
  get isLocated(): boolean {
    return this.environmentId !== null;
  }
}
