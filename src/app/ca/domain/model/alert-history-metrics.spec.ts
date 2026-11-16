import { attentionTime, resolutionTime, summarizeAlertHistory } from './alert-history-metrics';
import { AlertSeverity, AlertStatus, DeviationAlert } from './deviation-alert.entity';

const MINUTE = 60 * 1000;

const alertOf = (
  id: number,
  severity: AlertSeverity,
  status: AlertStatus,
  acknowledgedAt: string | null = null,
  resolvedAt: string | null = null,
) =>
  new DeviationAlert({
    id,
    equipmentId: 1,
    parameterName: 'HUMIDITY',
    recordedValue: 71,
    thresholdValue: 70,
    unit: '%RH',
    timestamp: '2026-10-05T10:00:00Z',
    severity,
    status,
    acknowledgedAt,
    resolvedAt,
  });

describe('alert history metrics', () => {
  it('measures the time until the attention and until the resolution', () => {
    const alert = alertOf(
      1,
      'CRITICAL',
      'RESOLVED',
      '2026-10-05T10:25:00Z',
      '2026-10-05T12:00:00Z',
    );

    expect(attentionTime(alert)).toBe(25 * MINUTE);
    expect(resolutionTime(alert)).toBe(120 * MINUTE);
  });

  it('has no time while the step has not happened', () => {
    const open = alertOf(1, 'CRITICAL', 'UNRESOLVED');

    expect(attentionTime(open)).toBeNull();
    expect(resolutionTime(open)).toBeNull();
  });

  it('counts the alerts by severity and the share of resolved ones', () => {
    const summary = summarizeAlertHistory([
      alertOf(1, 'CRITICAL', 'RESOLVED'),
      alertOf(2, 'CRITICAL', 'ACKNOWLEDGED'),
      alertOf(3, 'WARNING', 'RESOLVED'),
      alertOf(4, 'WARNING', 'RESOLVED'),
      alertOf(5, 'WARNING', 'RESOLVED'),
    ]);

    expect(summary.total).toBe(5);
    expect(summary.bySeverity).toEqual({ LOW: 0, WARNING: 3, CRITICAL: 2 });
    expect(summary.resolved).toBe(4);
    expect(summary.resolvedPercent).toBe(80);
  });

  it('averages only the alerts that already have each time', () => {
    const summary = summarizeAlertHistory([
      alertOf(1, 'WARNING', 'RESOLVED', '2026-10-05T10:10:00Z', '2026-10-05T11:00:00Z'),
      alertOf(2, 'WARNING', 'RESOLVED', '2026-10-05T10:30:00Z', '2026-10-05T13:00:00Z'),
      alertOf(3, 'CRITICAL', 'UNRESOLVED'),
    ]);

    expect(summary.averageAttentionTime).toBe(20 * MINUTE);
    expect(summary.averageResolutionTime).toBe(120 * MINUTE);
  });

  it('has no percentage nor averages without alerts', () => {
    const summary = summarizeAlertHistory([]);

    expect(summary.total).toBe(0);
    expect(summary.resolvedPercent).toBeNull();
    expect(summary.averageAttentionTime).toBeNull();
    expect(summary.averageResolutionTime).toBeNull();
  });
});
