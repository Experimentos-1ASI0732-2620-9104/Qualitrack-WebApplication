import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents the evaluated health status of a KPI metric.
 *
 * @remarks
 * This type restricts the metric lifecycle/status values to the states supported
 * by the Reporting and Analysis bounded context and the backend API contract.
 */
export type KpiMetricStatus = 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' | 'UNKNOWN';

/**
 * Represents an individual Key Performance Indicator (KPI) metric.
 *
 * @remarks
 * In Domain-Driven Design, KpiMetric is an entity that captures a specific
 * measurement of laboratory or process performance. It compares a recorded
 * value against a defined target to determine operational status.
 *
 * This entity is crucial for tracking specific goals, such as equipment
 * uptime, calibration precision, or sample turnaround times.
 *
 * @example
 * ```typescript
 * const availabilityMetric = new KpiMetric({
 *   id: 1,
 *   name: 'Equipment Availability',
 *   value: 97.5,
 *   unit: '%',
 *   targetValue: 95,
 *   status: 'ON_TRACK',
 *   recordedAt: '2026-05-12T11:00:00Z'
 * });
 *
 * console.log(availabilityMetric.status); // 'ON_TRACK'
 * ```
 */
export class KpiMetric implements BaseEntity {
  /**
   * The unique numeric identifier for this KPI metric record.
   */
  id: number | null;

  /**
   * The name of the performance indicator (e.g., 'Equipment Availability').
   */
  name: string;

  /**
   * The current measured value of the metric.
   */
  value: number;

  /**
   * The unit of measurement for this metric.
   */
  unit: string;

  /**
   * The goal or threshold value against which the current value is evaluated.
   */
  targetValue: number | null;

  /**
   * The evaluated health status of the metric based on its performance against the target.
   */
  status: KpiMetricStatus;

  /**
   * The timestamp when this metric was recorded.
   */
  recordedAt: string;

  /**
   * Creates a new KpiMetric entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric ID of the metric
   * @param params.name - Descriptive name of the indicator
   * @param params.value - Current measurement
   * @param params.unit - Measurement unit
   * @param params.targetValue - Goal value or expected threshold
   * @param params.status - Operational health status
   * @param params.recordedAt - Recording timestamp
   *
   * @remarks
   * The constructor initializes the KPI metric with the measured value and
   * its evaluation result, allowing the presentation layer to render dashboard
   * summaries without duplicating status calculation logic.
   */
  constructor(params: {
    id: number | null;
    name: string;
    value: number;
    unit: string;
    targetValue: number | null;
    status: KpiMetricStatus;
    recordedAt: string;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.value = params.value;
    this.unit = params.unit;
    this.targetValue = params.targetValue;
    this.status = params.status;
    this.recordedAt = params.recordedAt;
  }
}
