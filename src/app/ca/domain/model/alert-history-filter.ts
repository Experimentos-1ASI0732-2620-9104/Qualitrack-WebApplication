import { AlertOrigin, AlertSeverity, AlertStatus, DeviationAlert } from './deviation-alert.entity';

/** Days back that the history shows; `null` means the person chose their own dates. */
export type AlertHistoryPeriod = 7 | 30 | 90 | null;

/** What the person chose in the chips and the search box of the alert history. */
export interface AlertHistoryFilter {
  /** Days back to show, or `null` to use {@link AlertHistoryFilter.from} and {@link AlertHistoryFilter.to}. */
  period: AlertHistoryPeriod;
  /** First day of a custom period, as `YYYY-MM-DD`; `null` means no lower limit. */
  from: string | null;
  /** Last day of a custom period, as `YYYY-MM-DD`; `null` means no upper limit. */
  to: string | null;
  /** Severities to show; an empty list shows every severity. */
  severities: AlertSeverity[];
  /** Statuses to show; an empty list shows every status. */
  statuses: AlertStatus[];
  /** Origins to show; an empty list shows every origin. */
  origins: AlertOrigin[];
  /** Text to look for in the device, the variable or the resolution notes. */
  search: string;
}

/** Filter the history opens with: the last 90 days and every severity, status and origin. */
export const DEFAULT_ALERT_HISTORY_FILTER: AlertHistoryFilter = {
  period: 90,
  from: null,
  to: null,
  severities: [],
  statuses: [],
  origins: [],
  search: '',
};

/** Milliseconds in one day. */
export const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

/** Distance from UTC to the time of the laboratories, which all operate in Peru (it has no daylight saving time). */
export const LABORATORY_OFFSET_IN_MILLISECONDS = -5 * 60 * 60 * 1000;

/**
 * Whether an alert started inside the period of the filter.
 *
 * @param alert - The alert
 * @param filter - The filter of the history
 * @param now - The current moment; it is a parameter so the tests can fix it
 * @returns `true` when the incident started inside the period
 *
 * @remarks
 * A custom period counts whole days of the laboratory, in Peru: `to` includes its whole day.
 */
export function isInPeriod(alert: DeviationAlert, filter: AlertHistoryFilter, now: Date): boolean {
  const startedAt = Date.parse(alert.timestamp);
  if (filter.period !== null) {
    return startedAt >= now.getTime() - filter.period * DAY_IN_MILLISECONDS;
  }
  if (filter.from && startedAt < startOfDay(filter.from)) return false;
  if (filter.to && startedAt >= startOfDay(filter.to) + DAY_IN_MILLISECONDS) return false;
  return true;
}

/** First and last moment of the period of a filter. */
export interface AlertHistoryRange {
  /** First moment, in milliseconds since 1970, or `null` when a custom period has no first day. */
  since: number | null;
  /** Last moment, in milliseconds since 1970; never later than now. */
  until: number;
}

/**
 * First and last moment of the period of the filter, which the weekly chart covers.
 *
 * @param filter - The filter of the history
 * @param now - The current moment; it is a parameter so the tests can fix it
 * @returns The range; a custom period counts whole days in Peru and does not go past now
 */
export function periodRangeOf(filter: AlertHistoryFilter, now: Date): AlertHistoryRange {
  if (filter.period !== null) {
    return { since: now.getTime() - filter.period * DAY_IN_MILLISECONDS, until: now.getTime() };
  }
  const lastMoment = filter.to ? startOfDay(filter.to) + DAY_IN_MILLISECONDS - 1 : now.getTime();
  return {
    since: filter.from ? startOfDay(filter.from) : null,
    until: Math.min(lastMoment, now.getTime()),
  };
}

/**
 * First moment of a day in the laboratory, in Peru.
 *
 * @param day - The day, as `YYYY-MM-DD`
 * @returns Milliseconds since 1970 at midnight of that day
 */
function startOfDay(day: string): number {
  return Date.parse(`${day}T00:00:00Z`) - LABORATORY_OFFSET_IN_MILLISECONDS;
}

/**
 * Whether an alert has one of the severities, statuses and origins chosen in the chips.
 *
 * @param alert - The alert
 * @param filter - The filter of the history
 * @returns `true` when the alert passes the three groups of chips
 *
 * @remarks
 * A group with no chip chosen lets every alert through. An alert without origin only passes when no origin is chosen.
 */
export function matchesChips(alert: DeviationAlert, filter: AlertHistoryFilter): boolean {
  return (
    allows(filter.severities, alert.severity) &&
    allows(filter.statuses, alert.status) &&
    allows(filter.origins, alert.origin)
  );
}

/**
 * Whether a value is among the chosen ones, or nothing was chosen.
 *
 * @param chosen - The values chosen in a group of chips
 * @param value - The value of the alert, `null` when it is unknown
 * @returns `true` when the group is empty or holds the value
 */
function allows<T>(chosen: readonly T[], value: T | null): boolean {
  return chosen.length === 0 || (value !== null && chosen.includes(value));
}

/**
 * Whether any of the texts shown for an alert contains what the person searched.
 *
 * @param search - What the person wrote in the search box
 * @param texts - Texts of the alert as the person sees them; `null` stands for a missing one
 * @returns `true` when the search is empty or one of the texts contains it
 *
 * @remarks
 * Ignores upper case, accents and spaces around the search, so `almacen` finds `Almacén`.
 */
export function matchesSearch(search: string, texts: readonly (string | null)[]): boolean {
  const wanted = simplify(search);
  if (!wanted) return true;
  return texts.some((text) => text !== null && simplify(text).includes(wanted));
}

/**
 * Text in lower case, without accents and without spaces around it.
 *
 * @param text - The text
 * @returns The simplified text
 */
function simplify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Alerts that pass every part of the filter: period, chips and search.
 *
 * @param alerts - Every alert read for the history
 * @param filter - The filter of the history
 * @param now - The current moment
 * @param textsOf - Gives the texts shown for an alert, where the search looks
 * @returns The alerts that pass, in the same order they came
 */
export function filterAlertHistory(
  alerts: readonly DeviationAlert[],
  filter: AlertHistoryFilter,
  now: Date,
  textsOf: (alert: DeviationAlert) => readonly (string | null)[],
): DeviationAlert[] {
  return alerts.filter(
    (alert) =>
      isInPeriod(alert, filter, now) &&
      matchesChips(alert, filter) &&
      matchesSearch(filter.search, textsOf(alert)),
  );
}
