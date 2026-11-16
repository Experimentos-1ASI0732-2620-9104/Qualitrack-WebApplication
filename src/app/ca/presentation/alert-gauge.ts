import { DeviationAlert } from '../domain/model/deviation-alert.entity';

/** Where the reading and the limit of an alert fall on its bar, in percent of the bar. */
export interface AlertGauge {
  value: number;
  limit: number;
}

/**
 * Places the reading of an alert and its limit on one scale, so a bar shows at a glance how far the
 * reading went past the limit.
 *
 * @remarks
 * The scale goes from zero, or from the lowest value when there are readings below zero, to the
 * highest value, so a reading above its limit always ends after the mark and a reading below its
 * limit before it, also with negative temperatures. It leaves some room at both ends, so neither
 * value touches the end of the bar.
 *
 * @example
 * ```typescript
 * // A freezer that must stay at -15 °C or colder reads -10 °C: the fill ends after the mark.
 * alertGauge(alert); // { value: 42, limit: 13 }
 * ```
 *
 * @param alert - The alert
 * @returns The reading and the limit, in percent of the bar
 */
export function alertGauge(alert: DeviationAlert): AlertGauge {
  const { recordedValue: value, thresholdValue: limit } = alert;
  const low = Math.min(0, value, limit) * 1.15;
  const high = Math.max(0, value, limit) * 1.15;
  const span = high - low || 1;
  const percent = (amount: number) =>
    Math.min(100, Math.max(0, Math.round(((amount - low) / span) * 1000) / 10));
  return { value: percent(value), limit: percent(limit) };
}
