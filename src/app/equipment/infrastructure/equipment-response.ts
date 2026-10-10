import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Equipment or IoT device returned by `/laboratories/{laboratoryId}/equipments`.
 *
 * @remarks
 * This interface defines the shape of the data as exposed by the API. The
 * `EquipmentAssembler` converts it into the `Equipment` domain entity.
 *
 * @example
 * ```typescript
 * const resource: EquipmentResource = {
 *   id: 1,
 *   laboratoryId: 10,
 *   environmentId: null,
 *   name: 'Environmental monitor',
 *   type: 'Sensor',
 *   model: 'ESP32-DevKit',
 *   serialNumber: 'AA:BB:CC:DD:EE:FF',
 *   status: 'OPERATIONAL',
 *   deviceType: 'ENVIRONMENTAL_DEVICE',
 *   sensorExternalId: 'esp32-lab-001',
 *   firmwareVersion: '1.0.0',
 *   createdAt: '2026-05-12T10:00:00Z'
 * };
 * ```
 */
export interface EquipmentResource extends BaseResource {
  /** The unique numeric identifier of the equipment. */
  id: number;

  /** The identifier of the laboratory where the equipment is registered. */
  laboratoryId: number;

  /** The identifier of the environment where the equipment is located, or `null` if it is not located yet. */
  environmentId: number | null;

  /** The display name of the equipment. */
  name: string;

  /** The type or category of the equipment. */
  type: string;

  /** The model of the equipment. */
  model: string;

  /** The serial number of the equipment. */
  serialNumber: string;

  /**
   * The operational status of the equipment.
   *
   * @remarks
   * It is received as plain text; the assembler casts it to `EquipmentStatus`.
   */
  status: string;

  /**
   * The IoT device type, or `null` for equipment that sends no telemetry.
   *
   * @remarks
   * It is received as plain text; the assembler casts it to `IotDeviceType`.
   */
  deviceType: string | null;

  /** The identifier with which Edge recognises the device, or `null` if it is not an IoT device. */
  sensorExternalId: string | null;

  /** The firmware version installed on the device, or `null` if unknown or not applicable. */
  firmwareVersion: string | null;

  /**
   * The creation date of the equipment record.
   *
   * @remarks
   * This value is commonly in ISO 8601 date format. It is optional because the API may not return it.
   */
  createdAt?: string;
}

/**
 * Represents an API response containing multiple equipment resources.
 *
 * @remarks
 * Its resources can be transformed into domain entities using `EquipmentAssembler`.
 */
export interface EquipmentsResponse extends BaseResponse {
  /** The collection of equipment resources returned by the API. */
  equipments: EquipmentResource[];
}
