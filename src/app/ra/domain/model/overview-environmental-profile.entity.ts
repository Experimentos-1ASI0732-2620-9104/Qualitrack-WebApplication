import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents the configured threshold limits for an environmental metric inside the operational overview.
 *
 * @remarks
 * This is a read-only projection of the Tracking & Telemetry thresholds. It defines the acceptable
 * operating range of a metric and determines whether a measurement is classified as NORMAL, WARNING or CRITICAL.
 */
export interface OverviewEnvironmentalThreshold {
  /** The metric identifier (e.g., TEMPERATURE, HUMIDITY). */
  metric: string;
  /** The unit of measurement (e.g., °C, %RH). */
  unit?: string;
  /** Lowest NORMAL value, or null when the metric has no lower limit. */
  normalMin: number | null;
  /** Highest NORMAL value, or null when the metric has no upper limit. */
  normalMax: number | null;
  /** Lowest WARNING value; lower values are CRITICAL. */
  criticalMin: number | null;
  /** Highest WARNING value; higher values are CRITICAL. */
  criticalMax: number | null;
}

/**
 * Domain entity representing the active environmental configuration applied to an environment or container monitor.
 *
 * @remarks
 * In DDD, this entity is owned by the Tracking context but consumed by Reporting & Audit to color the KPI cards.
 * It contains the thresholds required to evaluate the average readings.
 */
export class OverviewEnvironmentalProfile implements BaseEntity {
  constructor(
    /** Unique identifier of the environmental profile. */
    public readonly id: number,
    /** Scope where the configuration is applied. */
    public readonly scope: 'ENVIRONMENT' | 'CONTAINER_MONITOR',
    /** Identifier of the associated laboratory. */
    public readonly laboratoryId: number,
    /** Identifier of the associated environment. */
    public readonly environmentId: number | null,
    /** Identifier of the associated device. */
    public readonly deviceId: number | null,
    /** Configuration version currently applied by devices. */
    public readonly version: number,
    /** Collection of environmental threshold configurations. */
    public readonly thresholds: OverviewEnvironmentalThreshold[],
    /** Collection of automatic actuation rules configured for the profile. */
    public readonly actuationRules: { metric: string; state: string; action: string }[],
    /** Timestamp of the latest profile update. */
    public readonly updatedAt: string | null,
    /** Identifier of the user who made the last change. */
    public readonly updatedBy: number | null
  ) {}

  /**
   * Retrieves the threshold configuration associated with a metric.
   *
   * @param metric - Environmental metric identifier to search.
   * @returns The configured threshold or undefined when no configuration exists.
   */
  threshold(metric: string): OverviewEnvironmentalThreshold | undefined {
    return this.thresholds.find(t => t.metric === metric);
  }
}
