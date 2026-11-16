import { compareAlertsByNewest, compareAlertsByPriority } from './alert-priority';
import { AlertSeverity, AlertStatus, DeviationAlert } from './deviation-alert.entity';

const alertOf = (id: number, severity: AlertSeverity, status: AlertStatus, timestamp: string) =>
  new DeviationAlert({
    id,
    equipmentId: 1,
    parameterName: 'TEMPERATURE',
    recordedValue: 10,
    thresholdValue: 8,
    unit: '°C',
    timestamp,
    severity,
    status,
  });

describe('alert priority', () => {
  const low = alertOf(1, 'LOW', 'UNRESOLVED', '2026-10-01T10:00:00Z');
  const warning = alertOf(2, 'WARNING', 'UNRESOLVED', '2026-10-01T10:00:00Z');
  const attendedCritical = alertOf(3, 'CRITICAL', 'ACKNOWLEDGED', '2026-10-01T10:00:00Z');
  const newerCritical = alertOf(4, 'CRITICAL', 'UNRESOLVED', '2026-10-03T10:00:00Z');
  const olderCritical = alertOf(5, 'CRITICAL', 'UNRESOLVED', '2026-10-02T10:00:00Z');

  it('puts unattended critical alerts first, the oldest on top, and low ones last', () => {
    const sorted = [low, warning, attendedCritical, newerCritical, olderCritical].sort(
      compareAlertsByPriority,
    );

    expect(sorted.map((alert) => alert.id)).toEqual([5, 4, 3, 2, 1]);
  });

  it('can also put the latest incidents first', () => {
    const sorted = [attendedCritical, newerCritical, olderCritical].sort(compareAlertsByNewest);

    expect(sorted.map((alert) => alert.id)).toEqual([4, 5, 3]);
  });
});
