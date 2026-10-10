import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { ActuationAction } from './actuation-event.entity';
import { EnvironmentalState, MonitoredMetric } from './monitored-metric';

/**
 * Represents the configured threshold limits for an environmental metric.
 *
 * Thresholds define the acceptable operating range of a metric and determine
 * whether a measurement is classified as NORMAL, WARNING or CRITICAL.
 *
 * The configuration supports partial limits depending on the nature of each metric:
 * - Lower limits.
 * - Upper limits.
 * - Critical boundary values.
 *
 * These rules are used by the platform to evaluate environmental conditions.
 */
export interface EnvironmentalThreshold {
  metric: MonitoredMetric;
  unit: string;
  normalMin: number | null;
  normalMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
}

/**
 * Represents an automated action rule associated with a container monitor.
 *
 * Defines the relationship between an environmental condition and the actuator
 * operation that must be executed when that condition occurs.
 *
 * Rules are evaluated using the active environmental profile configuration.
 */
export interface ActuationRule {
  metric: MonitoredMetric;

  /**
   * Environmental state that triggers the action.
   *
   * NORMAL state is excluded because automation rules are only executed
   * for abnormal environmental conditions.
   */
  state: Exclude<EnvironmentalState, 'NORMAL'>;

  /**
   * Actuation action executed when the rule condition is satisfied.
   */
  action: ActuationAction;
}

/**
 * Domain entity representing the active environmental configuration
 * for an environment or container monitoring device.
 *
 * An environmental profile contains:
 * - Metric threshold configurations.
 * - Automated actuation rules.
 * - Version information for configuration tracking.
 *
 * The profile represents the configuration currently applied by IoT devices
 * to evaluate environmental conditions and execute automated responses.
 *
 * This entity provides traceability of configuration changes through
 * version management.
 */
export class EnvironmentalProfile implements BaseEntity {
  /**
   * Unique identifier of the environmental profile.
   */
  id: number;

  /**
   * Scope where the configuration is applied.
   *
   * ENVIRONMENT applies configuration to the general environment,
   * while CONTAINER_MONITOR applies configuration to a specific device.
   */
  scope: 'ENVIRONMENT' | 'CONTAINER_MONITOR';

  /**
   * Identifier of the associated environment.
   */
  environmentId: number | null;

  /**
   * Identifier of the associated monitoring device.
   */
  deviceId: number | null;

  /**
   * Configuration version currently applied by devices.
   *
   * The version increases every time the profile configuration changes,
   * allowing synchronization and traceability of applied settings.
   */
  version: number;

  /**
   * Collection of environmental threshold configurations.
   */
  thresholds: EnvironmentalThreshold[];

  /**
   * Collection of automatic actuation rules configured for the profile.
   */
  actuationRules: ActuationRule[];

  /**
   * Timestamp of the latest profile update.
   */
  updatedAt: string | null;

  /**
   * Creates a new environmental profile entity.
   *
   * @param params Properties required to initialize the environmental profile.
   */
  constructor(params: {
    id: number;
    scope: 'ENVIRONMENT' | 'CONTAINER_MONITOR';
    environmentId: number | null;
    deviceId: number | null;
    version: number;
    thresholds: EnvironmentalThreshold[];
    actuationRules: ActuationRule[];
    updatedAt: string | null;
  }) {
    this.id = params.id;
    this.scope = params.scope;
    this.environmentId = params.environmentId;
    this.deviceId = params.deviceId;
    this.version = params.version;
    this.thresholds = params.thresholds;
    this.actuationRules = params.actuationRules;
    this.updatedAt = params.updatedAt;
  }

  /**
   * Retrieves the threshold configuration associated with a metric.
   *
   * This method allows domain services to obtain the active evaluation
   * criteria for a specific environmental measurement.
   *
   * @param metric Environmental metric to search.
   * @returns The configured threshold or undefined when no configuration exists.
   */
  threshold(metric: MonitoredMetric): EnvironmentalThreshold | undefined {
    return this.thresholds.find((threshold) => threshold.metric === metric);
  }
}

/**
 * Represents the input data required to create or update environmental thresholds.
 *
 * The unit field is excluded because it is managed by the platform
 * according to the selected metric definition.
 */
export type ThresholdInput = Omit<EnvironmentalThreshold, 'unit'>;
