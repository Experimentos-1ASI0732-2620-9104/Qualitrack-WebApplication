import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type TrendDirection = 'STABLE' | 'INCREASING' | 'DECREASING';

/** Condition evaluated by the platform for a reading. */
export type ReadingState = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface DataPoint {
  timestamp: string;
  recordedValue: number;
  upperThreshold: number | null;
  lowerThreshold: number | null;
  state: ReadingState | null;
}

/**
 * Deviation indicators of a variable of a device in a period (US94, TS82).
 *
 * @remarks
 * Time in range: each evaluated reading keeps its condition until the next one; it is the NORMAL time over the time
 * between the first and the last evaluated reading. Deviations are readings worse than the previous one.
 */
export class DeviationTrend implements BaseEntity {
  id: number | null;
  parameterName: string;
  /** Environmental device or container monitor. */
  equipmentId: number;
  environmentId: number | null;
  unit: string | null;
  trendDirection: TrendDirection;
  evaluatedReadings: number;
  /** Null with fewer than two evaluated readings. */
  timeInRangePercent: number | null;
  deviationCount: number;
  criticalDeviationCount: number;
  dataPoints: DataPoint[];

  constructor(params: {
    id: number | null;
    parameterName: string;
    equipmentId: number;
    environmentId?: number | null;
    unit?: string | null;
    trendDirection: TrendDirection;
    evaluatedReadings?: number;
    timeInRangePercent?: number | null;
    deviationCount?: number;
    criticalDeviationCount?: number;
    dataPoints: DataPoint[];
  }) {
    this.id = params.id;
    this.parameterName = params.parameterName;
    this.equipmentId = params.equipmentId;
    this.environmentId = params.environmentId ?? null;
    this.unit = params.unit ?? null;
    this.trendDirection = params.trendDirection;
    this.evaluatedReadings = params.evaluatedReadings ?? 0;
    this.timeInRangePercent = params.timeInRangePercent ?? null;
    this.deviationCount = params.deviationCount ?? 0;
    this.criticalDeviationCount = params.criticalDeviationCount ?? 0;
    this.dataPoints = params.dataPoints;
  }
}
