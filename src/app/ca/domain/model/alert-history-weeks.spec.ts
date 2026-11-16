import { countAlertsByWeek } from './alert-history-weeks';
import { AlertSeverity, DeviationAlert } from './deviation-alert.entity';

const alertOf = (id: number, timestamp: string, severity: AlertSeverity) =>
  new DeviationAlert({
    id,
    equipmentId: 1,
    parameterName: 'HUMIDITY',
    recordedValue: 71,
    thresholdValue: 70,
    unit: '%RH',
    timestamp,
    severity,
    status: 'RESOLVED',
  });

describe('countAlertsByWeek', () => {
  it('counts the alerts of each week by severity, starting on Monday in Peru', () => {
    const weeks = countAlertsByWeek(
      [
        alertOf(1, '2026-09-14T10:00:00-05:00', 'WARNING'),
        alertOf(2, '2026-09-20T23:30:00-05:00', 'CRITICAL'),
        alertOf(3, '2026-09-21T00:30:00-05:00', 'WARNING'),
      ],
      Date.parse('2026-09-14T00:00:00-05:00'),
      Date.parse('2026-09-27T12:00:00-05:00'),
    );

    expect(weeks).toEqual([
      { start: '2026-09-14', bySeverity: { LOW: 0, WARNING: 1, CRITICAL: 1 } },
      { start: '2026-09-21', bySeverity: { LOW: 0, WARNING: 1, CRITICAL: 0 } },
    ]);
  });

  it('keeps the weeks without alerts so the chart shows the gaps', () => {
    const weeks = countAlertsByWeek(
      [alertOf(1, '2026-09-15T10:00:00-05:00', 'LOW')],
      null,
      Date.parse('2026-10-01T12:00:00-05:00'),
    );

    expect(weeks.map((week) => week.start)).toEqual(['2026-09-14', '2026-09-21', '2026-09-28']);
    expect(weeks[2].bySeverity).toEqual({ LOW: 0, WARNING: 0, CRITICAL: 0 });
  });

  it('keeps the empty weeks at the start of a period it can draw whole', () => {
    const weeks = countAlertsByWeek(
      [alertOf(1, '2026-09-15T10:00:00-05:00', 'LOW')],
      Date.parse('2026-08-31T00:00:00-05:00'),
      Date.parse('2026-09-16T12:00:00-05:00'),
    );

    expect(weeks.map((week) => week.start)).toEqual(['2026-08-31', '2026-09-07', '2026-09-14']);
  });

  it('starts at the oldest alert when the period is too long to draw, as while a year is being typed', () => {
    const weeks = countAlertsByWeek(
      [alertOf(1, '2026-09-22T10:00:00-05:00', 'LOW'), alertOf(2, '2026-09-15T10:00:00-05:00', 'LOW')],
      Date.parse('0202-10-01T00:00:00-05:00'),
      Date.parse('2026-10-01T12:00:00-05:00'),
    );

    expect(weeks.map((week) => week.start)).toEqual(['2026-09-14', '2026-09-21', '2026-09-28']);
  });

  it('has no weeks without alerts nor start of the period', () => {
    expect(countAlertsByWeek([], null, Date.parse('2026-10-01T12:00:00Z'))).toEqual([]);
  });
});
