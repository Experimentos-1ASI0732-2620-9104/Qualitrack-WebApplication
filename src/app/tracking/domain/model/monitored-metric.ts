import { IotDeviceType } from '../../../equipment/domain/model/iot-device-type';

/**
 * Represents a measurement type reported by an IoT device.
 *
 * Each device type provides different monitoring capabilities:
 * - Environmental devices report air quality and motion events.
 * - Container monitors report temperature, humidity, luminosity and RFID information.
 *
 * These metrics are used by the platform to evaluate environmental conditions
 * and support monitoring and automation processes.
 */
export type MonitoredMetric = 'AIR_QUALITY' | 'MOTION' | 'TEMPERATURE' | 'HUMIDITY' | 'LUMINOSITY' | 'RFID_TAG';

/**
 * Represents the evaluated condition state of an environmental metric.
 *
 * The state is determined by comparing received measurements
 * against the active environmental profile configuration.
 */
export type EnvironmentalState = 'NORMAL' | 'WARNING' | 'CRITICAL';

/**
 * Defines the metadata associated with a monitored metric.
 *
 * Provides information about:
 * - Measurement unit.
 * - Device type responsible for reporting the metric.
 * - Threshold configuration availability.
 *
 * This definition allows the application to dynamically handle
 * different monitoring capabilities without duplicating business rules.
 */
export interface MetricDefinition {

  /**
   * Metric identifier represented by the device.
   */
  metric: MonitoredMetric;

  /**
   * Measurement unit used to display and interpret the metric value.
   */
  unit: string;

  /**
   * Type of IoT device responsible for generating this metric.
   */
  deviceType: IotDeviceType;

  /**
   * Indicates whether quality managers can configure
   * WARNING and CRITICAL thresholds for this metric.
   */
  configurable: boolean;

  /**
   * Indicates whether the metric is evaluated only against
   * an upper limit.
   *
   * This applies to metrics where higher values represent
   * increasing risk conditions.
   */
  upperOnly: boolean;
}

/**
 * Collection of all monitoring metrics supported by the IoT platform.
 *
 * This constant works as the central catalog of available metrics,
 * defining their units, supported devices and configuration rules.
 */
export const METRICS: readonly MetricDefinition[] = [
  { metric: 'AIR_QUALITY', unit: 'ppm', deviceType: 'ENVIRONMENTAL_DEVICE', configurable: true, upperOnly: true },
  { metric: 'MOTION', unit: 'event', deviceType: 'ENVIRONMENTAL_DEVICE', configurable: false, upperOnly: false },
  { metric: 'TEMPERATURE', unit: '°C', deviceType: 'CONTAINER_MONITOR', configurable: true, upperOnly: false },
  { metric: 'HUMIDITY', unit: '%RH', deviceType: 'CONTAINER_MONITOR', configurable: true, upperOnly: false },
  { metric: 'LUMINOSITY', unit: 'lux', deviceType: 'CONTAINER_MONITOR', configurable: true, upperOnly: false },
  { metric: 'RFID_TAG', unit: 'tag', deviceType: 'CONTAINER_MONITOR', configurable: false, upperOnly: false },
];

/**
 * Retrieves all metrics supported by a specific IoT device type.
 *
 * This function allows the application to determine which monitoring
 * capabilities are available depending on the device category.
 *
 * @param deviceType IoT device type used to filter supported metrics.
 * @returns List of metrics reported by the specified device type.
 */
export function metricsOf(deviceType: IotDeviceType): MetricDefinition[] {
  return METRICS.filter((definition) => definition.deviceType === deviceType);
}

/**
 * Retrieves the metrics that support threshold configuration
 * for a specific IoT device type.
 *
 * Only configurable metrics are returned because some metrics,
 * such as events or identifiers, do not require environmental limits.
 *
 * @param deviceType IoT device type used to filter configurable metrics.
 * @returns Metrics where quality managers can configure thresholds.
 */
export function configurableMetricsOf(deviceType: IotDeviceType): MetricDefinition[] {
  return metricsOf(deviceType).filter((definition) => definition.configurable);
}

/**
 * Finds the definition of a specific monitoring metric.
 *
 * Provides access to metric metadata such as unit, device type,
 * and configuration capabilities.
 *
 * @param metric Metric identifier to search.
 * @returns The metric definition when found; otherwise undefined.
 */
export function metricDefinition(metric: string): MetricDefinition | undefined {
  return METRICS.find((definition) => definition.metric === metric);
}
