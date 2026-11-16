import {
  AlertHistoryFilter,
  DEFAULT_ALERT_HISTORY_FILTER,
  filterAlertHistory,
  isInPeriod,
  matchesChips,
  matchesSearch,
  periodRangeOf,
} from './alert-history-filter';
import { AlertOrigin, AlertSeverity, AlertStatus, DeviationAlert } from './deviation-alert.entity';

const alertOf = (
  id: number,
  timestamp: string,
  severity: AlertSeverity = 'WARNING',
  status: AlertStatus = 'RESOLVED',
  origin: AlertOrigin | null = 'ENVIRONMENT',
) =>
  new DeviationAlert({
    id,
    origin,
    equipmentId: 1,
    parameterName: 'HUMIDITY',
    recordedValue: 71,
    thresholdValue: 70,
    unit: '%RH',
    timestamp,
    severity,
    status,
  });

const filterWith = (changes: Partial<AlertHistoryFilter>): AlertHistoryFilter => ({
  ...DEFAULT_ALERT_HISTORY_FILTER,
  ...changes,
});

const now = new Date('2026-11-04T12:00:00Z');

describe('alert history filter', () => {
  describe('isInPeriod', () => {
    it('keeps the alerts of the last days and leaves out the older ones', () => {
      const lastWeek = filterWith({ period: 7 });

      expect(isInPeriod(alertOf(1, '2026-11-01T10:00:00Z'), lastWeek, now)).toBe(true);
      expect(isInPeriod(alertOf(2, '2026-10-20T10:00:00Z'), lastWeek, now)).toBe(false);
    });

    it('counts the whole last day of a custom period in Peru', () => {
      const september = filterWith({ period: null, from: '2026-09-01', to: '2026-09-30' });

      expect(isInPeriod(alertOf(1, '2026-09-30T23:30:00-05:00'), september, now)).toBe(true);
      expect(isInPeriod(alertOf(2, '2026-10-01T00:30:00-05:00'), september, now)).toBe(false);
      expect(isInPeriod(alertOf(3, '2026-08-31T23:30:00-05:00'), september, now)).toBe(false);
    });

    it('has no limit on a side of a custom period without date', () => {
      const sinceOctober = filterWith({ period: null, from: '2026-10-01' });

      expect(isInPeriod(alertOf(1, '2020-01-01T10:00:00-05:00'), sinceOctober, now)).toBe(false);
      expect(isInPeriod(alertOf(2, '2030-01-01T10:00:00-05:00'), sinceOctober, now)).toBe(true);
    });
  });

  describe('periodRangeOf', () => {
    const now = new Date('2026-10-10T12:00:00Z');

    it('goes from the days back of the period until now', () => {
      expect(periodRangeOf({ ...DEFAULT_ALERT_HISTORY_FILTER, period: 7 }, now)).toEqual({
        since: Date.parse('2026-10-03T12:00:00Z'),
        until: now.getTime(),
      });
    });

    it('covers the whole days of a custom period in Peru, without going past now', () => {
      const custom = { ...DEFAULT_ALERT_HISTORY_FILTER, period: null };

      expect(periodRangeOf({ ...custom, from: '2026-09-01', to: '2026-09-30' }, now)).toEqual({
        since: Date.parse('2026-09-01T05:00:00Z'),
        until: Date.parse('2026-10-01T04:59:59.999Z'),
      });
      expect(periodRangeOf({ ...custom, to: '2026-12-31' }, now)).toEqual({
        since: null,
        until: now.getTime(),
      });
    });
  });

  describe('matchesChips', () => {
    const critical = alertOf(1, '2026-11-01T10:00:00Z', 'CRITICAL', 'ACKNOWLEDGED', 'CONTAINER');

    it('lets every alert through when no chip is chosen', () => {
      expect(matchesChips(critical, DEFAULT_ALERT_HISTORY_FILTER)).toBe(true);
    });

    it('needs the alert to pass every group of chips', () => {
      expect(matchesChips(critical, filterWith({ severities: ['CRITICAL', 'WARNING'] }))).toBe(
        true,
      );
      expect(matchesChips(critical, filterWith({ severities: ['WARNING'] }))).toBe(false);
      expect(
        matchesChips(critical, filterWith({ severities: ['CRITICAL'], statuses: ['RESOLVED'] })),
      ).toBe(false);
    });

    it('leaves out an alert without origin once an origin is chosen', () => {
      const unknown = alertOf(2, '2026-11-01T10:00:00Z', 'LOW', 'RESOLVED', null);

      expect(matchesChips(unknown, DEFAULT_ALERT_HISTORY_FILTER)).toBe(true);
      expect(matchesChips(unknown, filterWith({ origins: ['ENVIRONMENT'] }))).toBe(false);
    });
  });

  describe('matchesSearch', () => {
    it('ignores upper case, accents and spaces around the search', () => {
      expect(matchesSearch('  ALMACEN ', ['Monitor del Almacén'])).toBe(true);
    });

    it('skips the missing texts and finds nothing that is not there', () => {
      expect(matchesSearch('filtro', [null, 'Humedad'])).toBe(false);
      expect(matchesSearch('filtro', [null, 'Filtro HEPA reemplazado'])).toBe(true);
    });

    it('lets every alert through when the search is empty', () => {
      expect(matchesSearch('   ', [])).toBe(true);
    });
  });

  describe('filterAlertHistory', () => {
    it('keeps only the alerts that pass the period, the chips and the search', () => {
      const alerts = [
        alertOf(1, '2026-11-01T10:00:00Z', 'CRITICAL'),
        alertOf(2, '2026-11-02T10:00:00Z', 'WARNING'),
        alertOf(3, '2026-06-01T10:00:00Z', 'CRITICAL'),
        alertOf(4, '2026-11-03T10:00:00Z', 'CRITICAL'),
      ];
      const notes: Record<number, string> = { 1: 'Sensor recalibrado', 4: 'Puerta cerrada' };

      const shown = filterAlertHistory(
        alerts,
        filterWith({ severities: ['CRITICAL'], search: 'sensor' }),
        now,
        (alert) => [notes[alert.id] ?? null],
      );

      expect(shown.map((alert) => alert.id)).toEqual([1]);
    });
  });
});
