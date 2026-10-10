import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnvironmentalState, MonitoredMetric } from './monitored-metric';

/**
 * Reading of an IoT device evaluated with the profile in force (Measurement).
 */
export class Measurement implements BaseEntity {
  id: number;

  deviceId: number;

  environmentId: number | null;

  metric: MonitoredMetric;

  /** Numeric value; null for an RFID reading. */
  value: number | null;

  /** Tag read by an RFID reading. */
  textValue: string | null;

  unit: string;

  measuredAt: string;

  /** NORMAL, WARNING or CRITICAL; null when the metric has no threshold. */
  state: EnvironmentalState | null;

  /** Limit crossed by a WARNING or CRITICAL reading. */
  thresholdValue: number | null;

  profileVersion: number | null;

  constructor(params: {
    id: number;
    deviceId: number;
    environmentId: number | null;
    metric: MonitoredMetric;
    value: number | null;
    textValue: string | null;
    unit: string;
    measuredAt: string;
    state: EnvironmentalState | null;
    thresholdValue: number | null;
    profileVersion: number | null;
  }) {
    this.id = params.id;
    this.deviceId = params.deviceId;
    this.environmentId = params.environmentId;
    this.metric = params.metric;
    this.value = params.value;
    this.textValue = params.textValue;
    this.unit = params.unit;
    this.measuredAt = params.measuredAt;
    this.state = params.state;
    this.thresholdValue = params.thresholdValue;
    this.profileVersion = params.profileVersion;
  }

  /** Whether the reading is a WARNING or CRITICAL condition. */
  get isDeviation(): boolean {
    return this.state === 'WARNING' || this.state === 'CRITICAL';
  }
}

/**
 * Latest reading of each metric, newest per metric.
 */
export function latestByMetric(readings: readonly Measurement[]): Map<MonitoredMetric, Measurement> {
  const latest = new Map<MonitoredMetric, Measurement>();
  for (const reading of readings) {
    const current = latest.get(reading.metric);
    if (!current || Date.parse(reading.measuredAt) >= Date.parse(current.measuredAt)) latest.set(reading.metric, reading);
  }
  return latest;
}
