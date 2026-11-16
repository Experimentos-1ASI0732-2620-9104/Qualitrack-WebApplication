/**
 * Represents the target device or environment where telemetry information
 * is requested.
 *
 * The environmental device is represented with a null deviceId because
 * it belongs directly to the environment, while container monitors
 * require their own identifier.
 */
export interface DeviceTarget {
  laboratoryId: number;
  environmentId: number;
  /** Container monitor; null for the environmental device of the environment. */
  deviceId: number | null;
}
