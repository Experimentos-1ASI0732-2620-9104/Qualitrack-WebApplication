import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { alertGauge } from './alert-gauge';

describe('alertGauge', () => {
  const alertOf = (recordedValue: number, thresholdValue: number) =>
    new DeviationAlert({
      id: 7,
      environmentId: 1,
      origin: 'CONTAINER',
      equipmentId: 3,
      parameterName: 'TEMPERATURE',
      recordedValue,
      thresholdValue,
      unit: '°C',
      timestamp: '2026-10-04T22:01:00Z',
      severity: 'CRITICAL',
      status: 'UNRESOLVED',
    });

  it('keeps the scale from zero when both values are positive', () => {
    expect(alertGauge(alertOf(951, 900))).toEqual({ value: 87, limit: 82.3 });
  });

  it.each([
    ['a reading above a positive maximum', 12.5, 12],
    ['a freezer warmer than its maximum', -10, -15],
    ['a reading above zero with a maximum below zero', 2, -18],
  ])('ends the fill after the mark for %s', (_, recorded, threshold) => {
    const gauge = alertGauge(alertOf(recorded, threshold));
    expect(gauge.value).toBeGreaterThan(gauge.limit);
  });

  it.each([
    ['a reading under a positive minimum', 1, 2],
    ['a freezer colder than its minimum', -30, -25],
    ['a reading below zero with a minimum above zero', -1, 2],
  ])('ends the fill before the mark for %s', (_, recorded, threshold) => {
    const gauge = alertGauge(alertOf(recorded, threshold));
    expect(gauge.value).toBeLessThan(gauge.limit);
  });

  it('never leaves the bar, even with zero values', () => {
    for (const [recorded, threshold] of [[0, 0], [-40, 0], [0, 40], [-5, -5]]) {
      const { value, limit } = alertGauge(alertOf(recorded, threshold));
      for (const percent of [value, limit]) {
        expect(percent).toBeGreaterThanOrEqual(0);
        expect(percent).toBeLessThanOrEqual(100);
      }
    }
  });
});
