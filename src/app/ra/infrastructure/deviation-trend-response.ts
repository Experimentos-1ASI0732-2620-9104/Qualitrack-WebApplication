import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { ReadingState, TrendDirection } from '../domain/model/deviation-trend.entity';

export interface DataPointResource {
  timestamp: string;
  recordedValue: number;
  upperThreshold: number | null;
  lowerThreshold: number | null;
  state: ReadingState | null;
}

/** Deviation indicators of a variable, from /laboratories/{laboratoryId}/environments/{environmentId}/deviation-trends. */
export interface DeviationTrendResource extends BaseResource {
  id: number | null;
  parameterName: string;
  equipmentId: number;
  environmentId: number | null;
  unit: string | null;
  trendDirection: TrendDirection;
  evaluatedReadings: number;
  timeInRangePercent: number | null;
  deviationCount: number;
  criticalDeviationCount: number;
  dataPoints: DataPointResource[];
}

export interface DeviationTrendsResponse extends BaseResponse {
  trends: DeviationTrendResource[];
}
