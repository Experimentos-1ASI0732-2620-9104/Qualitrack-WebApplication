import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { KpiMetric } from './kpi-metric.entity';

/** Average, minimum and maximum of the readings of a device and metric in the period (US93). */
export interface MeasurementSummary {
  environmentId: number;
  deviceId: number;
  metric: string;
  unit: string;
  readings: number;
  average: number;
  minimum: number;
  maximum: number;
  firstMeasuredAt: string;
  lastMeasuredAt: string;
}

/**
 * Indicators of a laboratory calculated from persisted records: operational counts and the summary of the
 * environmental readings of a period (US93, TS81).
 */
export class KpiDashboard implements BaseEntity {
  id: number | null;
  laboratoryId: number;
  timestamp: string;
  overallHealthScore: number | null;
  /** Period of the measurement summaries. */
  from: string | null;
  to: string | null;
  metrics: KpiMetric[];
  measurementSummaries: MeasurementSummary[];

  constructor(params: {
    id: number | null;
    laboratoryId: number;
    timestamp: string;
    overallHealthScore: number | null;
    from?: string | null;
    to?: string | null;
    metrics: KpiMetric[];
    measurementSummaries?: MeasurementSummary[];
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.timestamp = params.timestamp;
    this.overallHealthScore = params.overallHealthScore;
    this.from = params.from ?? null;
    this.to = params.to ?? null;
    this.metrics = params.metrics;
    this.measurementSummaries = params.measurementSummaries ?? [];
  }
}
