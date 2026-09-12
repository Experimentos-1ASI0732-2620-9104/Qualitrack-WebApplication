import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents the detected direction of a deviation trend.
 *
 * @remarks
 * This type restricts trend direction values to the states supported by the
 * Reporting and Analysis bounded context and the backend API contract.
 */
export type TrendDirection = 'STABLE' | 'INCREASING' | 'DECREASING';

/**
 * Represents a single measured value used to analyze a deviation trend.
 *
 * @remarks
 * DataPoint is modeled as a simple structured object because it does not need
 * independent identity in the frontend domain model.
 */
export interface DataPoint {
  /**
   * The timestamp of when the measurement was recorded.
   */
  timestamp: string;

  /**
   * The actual measured value at the given timestamp.
   */
  recordedValue: number;

  /**
   * The upper acceptable threshold for the parameter.
   */
  upperThreshold: number;

  /**
   * The lower acceptable threshold for the parameter.
   */
  lowerThreshold: number;
}

/**
 * Represents the trend analysis of a process parameter for a specific equipment.
 *
 * @remarks
 * In Domain-Driven Design, a DeviationTrend is an entity that encapsulates
 * historical parameter measurements and their interpreted movement pattern.
 * It supports analysis for predictive maintenance and quality control.
 *
 * @example
 * ```typescript
 * const trend = new DeviationTrend({
 *   id: 1,
 *   parameterName: 'Temperature',
 *   equipmentId: 20,
 *   trendDirection: 'INCREASING',
 *   dataPoints: []
 * });
 * ```
 */
export class DeviationTrend implements BaseEntity {
  /**
   * The unique numeric identifier for this trend analysis record.
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
   * The identified movement pattern of the parameter.
   */
  trendDirection: TrendDirection;

  /**
   * The collection of temporal measurements used to determine the trend.
   */
  dataPoints: DataPoint[];

  /**
   * Creates a new DeviationTrend entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric identifier for the trend
   * @param params.parameterName - Name of the monitored parameter
   * @param params.equipmentId - Numeric ID of the equipment
   * @param params.trendDirection - Detected movement pattern
   * @param params.dataPoints - Historical measurements
   */
  constructor(params: {
    id: number | null;
    parameterName: string;
    equipmentId: number;
    trendDirection: TrendDirection;
    dataPoints: DataPoint[];
  }) {
    this.id = params.id;
    this.parameterName = params.parameterName;
    this.equipmentId = params.equipmentId;
    this.trendDirection = params.trendDirection;
    this.dataPoints = params.dataPoints;
  }
}
