import { DAY_IN_MILLISECONDS, LABORATORY_OFFSET_IN_MILLISECONDS } from './alert-history-filter';
import { AlertSeverity, DeviationAlert } from './deviation-alert.entity';

/** Alerts that started in one week, for one bar of the weekly chart of the history. */
export interface AlertWeek {
  /** Monday that opens the week in Peru, as `YYYY-MM-DD`. */
  start: string;
  /** How many alerts of each severity started that week. */
  bySeverity: Record<AlertSeverity, number>;
}

/** Longest period drawn whole, about two years; a longer one starts at its oldest alert. */
const LONGEST_WHOLE_PERIOD = 104 * 7 * DAY_IN_MILLISECONDS;

/**
 * Monday that opens the week of a moment, in Peru.
 *
 * @param moment - Milliseconds since 1970
 * @returns Midnight of that Monday, written as if Peru were at UTC so that the UTC methods of `Date` read it
 */
function weekStartOf(moment: number): number {
  const peru = new Date(moment + LABORATORY_OFFSET_IN_MILLISECONDS);
  const daysSinceMonday = (peru.getUTCDay() + 6) % 7;
  return Date.UTC(peru.getUTCFullYear(), peru.getUTCMonth(), peru.getUTCDate() - daysSinceMonday);
}

/**
 * Counts the alerts of each week between two moments, by severity.
 *
 * @param alerts - The alerts shown in the history
 * @param since - First moment of the period, or `null` to start at the oldest alert
 * @param until - Last moment of the period
 * @returns One week per bar, the oldest first, including the weeks without alerts
 *
 * @remarks
 * Weeks start on Monday in Peru. The weeks without alerts are kept so that the chart shows the gaps, except before the
 * oldest alert of a period longer than about two years: while a person types a date, the browser goes through years
 * such as 0202, which would be thousands of empty weeks.
 */
export function countAlertsByWeek(
  alerts: readonly DeviationAlert[],
  since: number | null,
  until: number,
): AlertWeek[] {
  const first =
    since !== null && until - since <= LONGEST_WHOLE_PERIOD
      ? since
      : alerts.reduce((oldest, alert) => Math.min(oldest, Date.parse(alert.timestamp)), Infinity);
  if (!Number.isFinite(first) || first > until) return [];

  const weeks = new Map<number, AlertWeek>();
  for (let week = weekStartOf(first); week <= weekStartOf(until); week += 7 * DAY_IN_MILLISECONDS) {
    const start = new Date(week).toISOString().slice(0, 10);
    weeks.set(week, { start, bySeverity: { LOW: 0, WARNING: 0, CRITICAL: 0 } });
  }
  for (const alert of alerts) {
    const week = weeks.get(weekStartOf(Date.parse(alert.timestamp)));
    if (week) week.bySeverity[alert.severity]++;
  }
  return [...weeks.values()];
}
