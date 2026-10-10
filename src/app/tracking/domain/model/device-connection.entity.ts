import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents the communication status of an IoT device.
 *
 * A device is considered CONNECTED when it has communicated within
 * the expected communication period. Otherwise, the device requires
 * review because its connectivity status may indicate a communication issue.
 */
export type DeviceConnectionStatus = 'CONNECTED' | 'REQUIRES_REVIEW';

/**
 * Domain entity representing the connectivity state of an IoT device.
 *
 * This entity stores the current communication status between the device
 * and the Edge infrastructure, including the latest successful communication
 * timestamp and the expected communication frequency.
 *
 * The platform uses this information to determine device availability
 * and identify devices that may require technical inspection.
 *
 * @remarks
 * The connection status is derived from telemetry data or heartbeat messages
 * received from the IoT device.
 */
export class DeviceConnection implements BaseEntity {
  /**
   * Unique identifier of the device equipment.
   */
  id: number;

  /**
   * Current communication status of the device.
   *
   * Indicates whether the device is actively communicating
   * or requires further review.
   */
  connectionStatus: DeviceConnectionStatus;

  /**
   * Timestamp of the latest communication received from the device.
   *
   * A null value indicates that the device has not communicated
   * with the platform yet.
   */
  lastCommunicationAt: string | null;

  /**
   * Expected communication interval between device messages.
   *
   * The value is represented in seconds and is used by the platform
   * to evaluate whether the device remains available.
   */
  expectedPeriodSeconds: number;

  /**
   * Creates a new device connection entity.
   *
   * @param params Properties required to initialize the device connection state.
   */
  constructor(params: {
    id: number;
    connectionStatus: DeviceConnectionStatus;
    lastCommunicationAt: string | null;
    expectedPeriodSeconds: number;
  }) {
    this.id = params.id;
    this.connectionStatus = params.connectionStatus;
    this.lastCommunicationAt = params.lastCommunicationAt;
    this.expectedPeriodSeconds = params.expectedPeriodSeconds;
  }

  /**
   * Determines whether the device is currently connected.
   *
   * @returns true when the device communication status is CONNECTED;
   * false when the device requires review.
   */
  get isConnected(): boolean {
    return this.connectionStatus === 'CONNECTED';
  }
}
