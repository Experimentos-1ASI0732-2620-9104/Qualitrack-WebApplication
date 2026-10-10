/**
 * Body of `POST /laboratories/{laboratoryId}/equipments` (TS31).
 *
 * @example
 * ```typescript
 * const request: RegisterEquipmentRequest = {
 *   name: 'Analytical balance',
 *   type: 'Balance',
 *   model: 'AX-224',
 *   serialNumber: 'SN-12345'
 * };
 * ```
 */
export interface RegisterEquipmentRequest {
  /** The display name of the equipment. */
  name: string;

  /** The type or category of the equipment. */
  type: string;

  /** The model of the equipment. */
  model: string;

  /** The serial number of the equipment. */
  serialNumber: string;
}

/**
 * Body of `POST /laboratories/{laboratoryId}/devices/{environmental-devices|container-monitors}` (TS37, TS39).
 *
 * @remarks
 * The kind of device is not part of the body: it is given by the last segment of the URL.
 *
 * @example
 * ```typescript
 * const request: RegisterIotDeviceRequest = {
 *   name: 'Container monitor 1',
 *   sensorExternalId: 'esp32-container-001',
 *   serialNumber: 'AA:BB:CC:DD:EE:FF',
 *   model: 'ESP32-DevKit',
 *   firmwareVersion: '1.0.0'
 * };
 * ```
 */
export interface RegisterIotDeviceRequest {
  /** The display name of the device. */
  name: string;

  /** The unique identifier with which Edge recognises the device. */
  sensorExternalId: string;

  /** The MAC address or serial number of the device. */
  serialNumber: string;

  /** The model of the device. */
  model: string;

  /** The firmware version installed on the device, or `null` if unknown. */
  firmwareVersion: string | null;
}

/**
 * Body of `POST .../environments/{environmentId}/equipments` (TS33).
 *
 * @remarks
 * Locates an equipment in an environment.
 */
export interface AssignEquipmentRequest {
  /** The identifier of the equipment to locate in the environment. */
  equipmentId: number;
}

/**
 * Body of `POST .../environments/{environmentId}/{environmental-devices|container-monitors}` (TS38, TS40).
 *
 * @remarks
 * Locates an IoT device in an environment.
 */
export interface AssignDeviceRequest {
  /** The identifier of the IoT device to locate in the environment. */
  deviceId: number;
}

/**
 * Body of `POST .../equipments/{equipmentId}/status-changes` (TS34).
 *
 * @example
 * ```typescript
 * const request: ChangeEquipmentStatusRequest = {
 *   status: 'MAINTENANCE',
 *   reason: 'Scheduled preventive maintenance'
 * };
 * ```
 */
export interface ChangeEquipmentStatusRequest {
  /**
   * The new operational status of the equipment.
   *
   * @remarks
   * It should be one of the values of `EquipmentStatus`.
   */
  status: string;

  /** The reason for the status change, or `null` when no reason is provided. */
  reason: string | null;
}
