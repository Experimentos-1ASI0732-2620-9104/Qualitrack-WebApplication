/**
 * Represents the time range used for telemetry queries.
 *
 * Both values follow ISO-8601 format to ensure consistent communication
 * between frontend and backend services.
 */
export interface TelemetryPeriod {
  from: string;
  to: string;
}
