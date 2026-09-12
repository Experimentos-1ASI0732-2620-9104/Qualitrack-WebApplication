import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { KpiMetricStatus } from '../domain/model/kpi-metric.entity';

/**
 * Resource representation of a single Key Performance Indicator (KPI) metric.
 *
 * @remarks
 * This resource mirrors the API representation of a KPI metric. It does not
 * contain domain behavior and is used only for HTTP serialization and mapping.
 */
export interface KpiMetricResource {
  /**
   * The unique numeric identifier for the KPI metric resource.
   */
  id: number | null;

  /**
   * The name of the performance indicator.
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
   * The target or threshold value used to evaluate the metric.
   */
  targetValue: number | null;

  /**
   * The evaluated health status of the metric.
   */
  status: KpiMetricStatus;

  /**
   * The timestamp when this metric was recorded.
   */
  recordedAt: string;
}

/**
 * Resource representation of a KPI dashboard snapshot for API communication.
 *
 * @remarks
 * In DDD, this resource is part of the infrastructure layer and represents
 * the dashboard payload as it appears in HTTP responses. It is converted into
 * a {@link KpiDashboard} domain entity by the KPI assembler.
 */
export interface KpiDashboardResource extends BaseResource {
  /**
   * The unique numeric identifier for the dashboard resource.
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
   * A calculated score representing the overall performance or health status.
   */
  overallHealthScore: number | null;

  /**
   * The collection of KPI metrics included in this dashboard snapshot.
   */
  metrics: KpiMetricResource[];
}

/**
 * Response envelope for KPI dashboard collection queries.
 *
 * @remarks
 * Kept for compatibility with the shared {@link BaseAssembler} contract.
 * For the aligned backend, collection endpoints should preferably return
 * direct arrays when multiple dashboards are needed.
 */
export interface KpiDashboardsResponse extends BaseResponse {
  /**
   * Array of KPI dashboard resources included in the response.
   */
  dashboards: KpiDashboardResource[];
}
