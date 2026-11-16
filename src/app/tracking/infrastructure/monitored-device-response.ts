/**
 * Equipment returned by `GET /laboratories/{laboratoryId}/equipments`, with the fields Tracking & Telemetry reads.
 */
export interface MonitoredDeviceResource {
  id: number;
  laboratoryId: number;
  environmentId: number | null;
  name: string;
  /** `ENVIRONMENTAL_DEVICE` or `CONTAINER_MONITOR` for IoT devices; null for process equipment. */
  deviceType: string | null;
}
