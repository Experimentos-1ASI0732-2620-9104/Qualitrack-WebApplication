import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { DeviationTrendResource, DeviationTrendsResponse } from './deviation-trend-response';

export class DeviationTrendAssembler implements BaseAssembler<
  DeviationTrend,
  DeviationTrendResource,
  DeviationTrendsResponse
> {
  toEntitiesFromResponse(response: DeviationTrendsResponse): DeviationTrend[] {
    return response.trends.map((resource) => this.toEntityFromResource(resource));
  }

  toEntitiesFromResources(resources: DeviationTrendResource[]): DeviationTrend[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: DeviationTrendResource): DeviationTrend {
    return new DeviationTrend({
      id: resource.id,
      parameterName: resource.parameterName,
      equipmentId: resource.equipmentId,
      environmentId: resource.environmentId,
      unit: resource.unit,
      trendDirection: resource.trendDirection,
      evaluatedReadings: resource.evaluatedReadings,
      timeInRangePercent: resource.timeInRangePercent,
      deviationCount: resource.deviationCount,
      criticalDeviationCount: resource.criticalDeviationCount,
      dataPoints: resource.dataPoints.map((point) => ({ ...point })),
    });
  }

  toResourceFromEntity(entity: DeviationTrend): DeviationTrendResource {
    return {
      id: entity.id,
      parameterName: entity.parameterName,
      equipmentId: entity.equipmentId,
      environmentId: entity.environmentId,
      unit: entity.unit,
      trendDirection: entity.trendDirection,
      evaluatedReadings: entity.evaluatedReadings,
      timeInRangePercent: entity.timeInRangePercent,
      deviationCount: entity.deviationCount,
      criticalDeviationCount: entity.criticalDeviationCount,
      dataPoints: entity.dataPoints.map((point) => ({ ...point })),
    };
  }
}
