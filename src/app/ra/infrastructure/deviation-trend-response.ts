import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { TrendDirection } from '../domain/model/deviation-trend.entity';

/**
 * Resource representation of a single measurement data point.
 *
 * @remarks
 * This resource is used inside a deviation trend response to transfer
 * historical parameter measurements and their thresholds over HTTP.
 */
export interface DataPointResource {
  /**
   * The timestamp of when the measurement was recorded.
   */
  timestamp: string;

  /**
   * The actual measured value at the given timestamp.
   */
  recordedValue: number;

  /**
   * The upper acceptable threshold for the measured parameter.
   */
  upperThreshold: number;

  /**
   * The lower acceptable threshold for the measured parameter.
   */
  lowerThreshold: number;
}

/**
 * Resource representation of a deviation trend for API communication.
 *
 * @remarks
 * In DDD, this is an infrastructure-level resource contract. It represents
 * the trend analysis payload returned by the backend and is converted into
 * a {@link DeviationTrend} domain entity by the deviation trend assembler.
 */
export interface DeviationTrendResource extends BaseResource {
  /**
   * The unique numeric identifier for the deviation trend resource.
   */
  id: number | null;

  /**
   * The name of the process parameter being analyzed.
   */
  parameterName: string;

  /**
   * The numeric identifier of the equipment associated with this trend.
   */
  equipmentId: number;

  /**
   * The detected direction of the trend.
   */
  trendDirection: TrendDirection;

  /**
   * The collection of temporal measurements that make up the trend analysis.
   */
  dataPoints: DataPointResource[];
}

/**
 * Response envelope for deviation trend collection queries.
 *
 * @remarks
 * Kept for compatibility with the shared {@link BaseAssembler} contract.
 * For the aligned backend, the list endpoint should preferably return
 * a direct {@link DeviationTrendResource} array.
 */
export interface DeviationTrendsResponse extends BaseResponse {
  /**
   * Array of deviation trend resources included in the response.
   */
  trends: DeviationTrendResource[];
}
