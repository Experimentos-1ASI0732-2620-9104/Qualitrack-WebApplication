/**
 * Environment returned by `GET /laboratories/{laboratoryId}/environments`, with the fields Tracking & Telemetry reads.
 */
export interface MonitoredEnvironmentResource {
  id: number;
  code: string;
  name: string;
  usage: string | null;
}
