/**
 * Numeric reading of a device that the operational overview charts.
 *
 * @remarks
 * Tracking & Telemetry records the measurements; Reporting & Audit keeps the device, variable, value and time.
 */
export class OverviewReading {
  deviceId: number;

  metric: string;

  value: number | null;

  unit: string;

  measuredAt: string;

  constructor(params: { deviceId: number; metric: string; value: number | null; unit: string; measuredAt: string }) {
    this.deviceId = params.deviceId;
    this.metric = params.metric;
    this.value = params.value;
    this.unit = params.unit;
    this.measuredAt = params.measuredAt;
  }

  /** Whether the reading can be charted: a finite value at a valid time of a variable other than motion. */
  get isChartable(): boolean {
    return (
      this.value !== null &&
      Number.isFinite(this.value) &&
      this.metric !== 'MOTION' &&
      Number.isFinite(Date.parse(this.measuredAt))
    );
  }
}
