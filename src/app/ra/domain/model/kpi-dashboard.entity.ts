import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { KpiMetric } from './kpi-metric.entity';

/**
 * Represents a snapshot of the Key Performance Indicators (KPIs) for a laboratory.
 *
 * @remarks
 * In Domain-Driven Design, KpiDashboard is an entity that aggregates various
 * performance metrics to provide a comprehensive view of operational health.
 * It serves as a point-in-time report for laboratory efficiency, equipment
 * availability, and quality compliance.
 *
 * This entity is primarily used for management dashboards and trend analysis
 * within the Reporting and Analysis bounded context.
 *
 * @example
 * ```typescript
 * const dashboard = new KpiDashboard({
 *   id: 1,
 *   laboratoryId: 10,
 *   timestamp: '2026-05-12T11:00:00Z',
 *   overallHealthScore: 92,
 *   metrics: []
 * });
 * ```
 */
export class KpiDashboard implements BaseEntity {
  /**
   * The unique numeric identifier for this dashboard snapshot.
   */
  id: number | null;

  /**
   * The numeric identifier of the laboratory associated with these KPIs.
   */
  laboratoryId: number;

  /**
   * The timestamp when these metrics were aggregated.
   */
  timestamp: string;

  /**
   * A calculated score representing the overall performance or health status of the lab.
   */
  overallHealthScore: number | null;

  /**
   * The collection of individual performance metrics included in this snapshot.
   */
  metrics: KpiMetric[];

  /**
   * Creates a new KpiDashboard entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric identifier for the dashboard
   * @param params.laboratoryId - Numeric ID of the laboratory
   * @param params.timestamp - Aggregation timestamp
   * @param params.overallHealthScore - Computed health score
   * @param params.metrics - Detailed list of KPI metrics
   */
  constructor(params: {
    id: number | null;
    laboratoryId: number;
    timestamp: string;
    overallHealthScore: number | null;
    metrics: KpiMetric[];
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.timestamp = params.timestamp;
    this.overallHealthScore = params.overallHealthScore;
    this.metrics = params.metrics;
  }
}
