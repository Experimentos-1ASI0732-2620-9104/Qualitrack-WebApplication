import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MonitoredMetric } from '../domain/model/monitored-metric';
import { DeviceTarget } from './device-target';
import { TelemetryPeriod } from './telemetry-period';

/**
 * Builds the API path for an environment or a specific container monitor.
 *
 * This helper centralizes URL generation logic depending on the target type,
 * avoiding duplicated route construction across endpoint implementations.
 *
 * @param base Base API URL.
 * @param target Environment or device target information.
 * @returns Complete resource path for the selected target.
 */
export function targetPath(base: string, target: DeviceTarget): string {
  const environmentPath = `${base}/${target.laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${target.environmentId}`;
  return target.deviceId === null
    ? environmentPath
    : `${environmentPath}${environment.containerMonitorsEndpointPath}/${target.deviceId}`;
}

/**
 * Creates query parameters required for telemetry requests.
 *
 * Includes the requested time period and optionally filters by
 * a specific monitored metric.
 *
 * @param period Telemetry time range.
 * @param metric Optional metric filter.
 * @returns HTTP query parameters.
 */
export function periodParams(period: TelemetryPeriod, metric?: MonitoredMetric | null): HttpParams {
  let params = new HttpParams().set('from', period.from).set('to', period.to);
  if (metric) params = params.set('metric', metric);
  return params;
}
