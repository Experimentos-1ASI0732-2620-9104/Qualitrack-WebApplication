import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Represents the API resource returned by the device telemetry status endpoint.
 *
 * This interface defines the external data contract used to transfer
 * device connectivity information from the backend service to the application.
 *
 * The resource contains communication status details required to determine
 * whether an IoT device is currently available or requires review.
 */
export interface DeviceConnectionResource extends BaseResource {

  /**
   * Identifier of the IoT device associated with the connection status.
   */
  deviceId: number;

  /**
   * Current connectivity status reported by the platform.
   *
   * The value is transformed into the corresponding domain type
   * when creating the DeviceConnection entity.
   */
  connectionStatus: string;

  /**
   * Timestamp of the latest communication received from the device.
   *
   * Null indicates that no communication has been received yet.
   */
  lastCommunicationAt: string | null;

  /**
   * Expected interval between device communications in seconds.
   *
   * Used by the platform to evaluate whether the device remains connected.
   */
  expectedPeriodSeconds: number;

}

/**
 * Represents the API response containing connectivity information
 * for multiple IoT devices.
 *
 * This response model is used by the infrastructure layer before
 * transforming external resources into domain entities.
 */
export interface DeviceConnectionsResponse extends BaseResponse {

  /**
   * Collection of device connection resources returned by the API.
   */
  devices: DeviceConnectionResource[];
}
