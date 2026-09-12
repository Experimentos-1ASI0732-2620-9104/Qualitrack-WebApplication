import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { KpiDashboard } from '../domain/model/kpi-dashboard.entity';
import { KpiMetric } from '../domain/model/kpi-metric.entity';
import { KpiDashboardResource, KpiDashboardsResponse } from './kpi-response';

/**
 * Assembler for converting between KPI dashboard domain entities and API resources.
 *
 * @remarks
 * In DDD, this assembler acts as the translation layer between:
 * - {@link KpiDashboard} domain entities
 * - {@link KpiDashboardResource} infrastructure resources
 * - {@link KpiDashboardsResponse} collection response envelopes
 *
 * This keeps the domain model independent from HTTP response structures.
 */
export class KpiAssembler implements BaseAssembler<
  KpiDashboard,
  KpiDashboardResource,
  KpiDashboardsResponse
> {
  /**
   * Converts a KPI dashboard response envelope into domain entities.
   *
   * @param response - API response envelope containing dashboard resources
   * @returns Array of KPI dashboard domain entities
   */
  toEntitiesFromResponse(response: KpiDashboardsResponse): KpiDashboard[] {
    return response.dashboards.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an array of KPI dashboard resources into domain entities.
   *
   * @param resources - Array of KPI dashboard resources returned by the backend
   * @returns Array of KPI dashboard domain entities
   *
   * @remarks
   * Use this method when the backend returns a direct JSON array instead of a wrapper.
   */
  toEntitiesFromResources(resources: KpiDashboardResource[]): KpiDashboard[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a KPI dashboard resource into a domain entity.
   *
   * @param resource - KPI dashboard API resource
   * @returns A new {@link KpiDashboard} domain entity
   */
  toEntityFromResource(resource: KpiDashboardResource): KpiDashboard {
    return new KpiDashboard({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      timestamp: resource.timestamp,
      overallHealthScore: resource.overallHealthScore,
      metrics: resource.metrics.map(
        (metric) =>
          new KpiMetric({
            id: metric.id,
            name: metric.name,
            value: metric.value,
            unit: metric.unit,
            targetValue: metric.targetValue,
            status: metric.status,
            recordedAt: metric.recordedAt,
          }),
      ),
    });
  }

  /**
   * Converts a KPI dashboard domain entity into an API resource.
   *
   * @param entity - KPI dashboard domain entity
   * @returns KPI dashboard resource suitable for HTTP communication
   */
  toResourceFromEntity(entity: KpiDashboard): KpiDashboardResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      timestamp: entity.timestamp,
      overallHealthScore: entity.overallHealthScore,
      metrics: entity.metrics.map((metric) => ({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        targetValue: metric.targetValue,
        status: metric.status,
        recordedAt: metric.recordedAt,
      })),
    };
  }
}
