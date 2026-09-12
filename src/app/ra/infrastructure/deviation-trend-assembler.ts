import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { DeviationTrendResource, DeviationTrendsResponse } from './deviation-trend-response';

/**
 * Assembler for converting between deviation trend domain entities and API resources.
 *
 * @remarks
 * In DDD, this assembler translates between:
 * - {@link DeviationTrend} domain entities
 * - {@link DeviationTrendResource} infrastructure resources
 * - {@link DeviationTrendsResponse} collection response envelopes
 *
 * This keeps trend analysis behavior and typing independent from HTTP structures.
 */
export class DeviationTrendAssembler implements BaseAssembler<
  DeviationTrend,
  DeviationTrendResource,
  DeviationTrendsResponse
> {
  /**
   * Converts a deviation trend response envelope into domain entities.
   *
   * @param response - API response envelope containing trend resources
   * @returns Array of deviation trend domain entities
   */
  toEntitiesFromResponse(response: DeviationTrendsResponse): DeviationTrend[] {
    return response.trends.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an array of deviation trend resources into domain entities.
   *
   * @param resources - Array of deviation trend resources returned by the backend
   * @returns Array of deviation trend domain entities
   *
   * @remarks
   * Use this method when the backend returns a direct JSON array instead of a wrapper.
   */
  toEntitiesFromResources(resources: DeviationTrendResource[]): DeviationTrend[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a deviation trend resource into a domain entity.
   *
   * @param resource - Deviation trend API resource
   * @returns A new {@link DeviationTrend} domain entity
   */
  toEntityFromResource(resource: DeviationTrendResource): DeviationTrend {
    return new DeviationTrend({
      id: resource.id,
      parameterName: resource.parameterName,
      equipmentId: resource.equipmentId,
      trendDirection: resource.trendDirection,
      dataPoints: resource.dataPoints.map((point) => ({
        timestamp: point.timestamp,
        recordedValue: point.recordedValue,
        upperThreshold: point.upperThreshold,
        lowerThreshold: point.lowerThreshold,
      })),
    });
  }

  /**
   * Converts a deviation trend domain entity into an API resource.
   *
   * @param entity - Deviation trend domain entity
   * @returns Deviation trend resource suitable for HTTP communication
   */
  toResourceFromEntity(entity: DeviationTrend): DeviationTrendResource {
    return {
      id: entity.id,
      parameterName: entity.parameterName,
      equipmentId: entity.equipmentId,
      trendDirection: entity.trendDirection,
      dataPoints: entity.dataPoints.map((point) => ({
        timestamp: point.timestamp,
        recordedValue: point.recordedValue,
        upperThreshold: point.upperThreshold,
        lowerThreshold: point.lowerThreshold,
      })),
    };
  }
}
