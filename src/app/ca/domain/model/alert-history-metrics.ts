import { AlertSeverity, DeviationAlert } from './deviation-alert.entity';

/**
 * Milliseconds between the start of an incident and its attention.
 *
 * @param alert - The alert
 * @returns The time until a person attended it, or `null` while nobody has
 */
export function attentionTime(alert: DeviationAlert): number | null {
  return timeSinceStart(alert, alert.acknowledgedAt);
}

/**
 * Milliseconds between the start of an incident and its resolution.
 *
 * @param alert - The alert
 * @returns The time until a person resolved it, or `null` while it is open
 */
export function resolutionTime(alert: DeviationAlert): number | null {
  return timeSinceStart(alert, alert.resolvedAt);
}

/**
 * Milliseconds from the start of an incident to a later moment.
 *
 * @param alert - The alert
 * @param moment - The later moment, as an ISO 8601 date-time
 * @returns The time between both, never negative, or `null` when a moment is missing or invalid
 */
function timeSinceStart(alert: DeviationAlert, moment: string | null): number | null {
  if (moment === null) return null;
  const elapsed = Date.parse(moment) - Date.parse(alert.timestamp);
  return Number.isNaN(elapsed) ? null : Math.max(0, elapsed);
}

/** Figures of the alerts shown in the history, for the cards above the table. */
export interface AlertHistorySummary {
  /** How many alerts there are. */
  total: number;
  /** How many alerts there are of each severity. */
  bySeverity: Record<AlertSeverity, number>;
  /** How many alerts are resolved. */
  resolved: number;
  /** Resolved alerts as a whole percentage of the total, or `null` when there are no alerts. */
  resolvedPercent: number | null;
  /** Average {@link attentionTime} of the attended alerts, or `null` when none was attended. */
  averageAttentionTime: number | null;
  /** Average {@link resolutionTime} of the resolved alerts, or `null` when none was resolved. */
  averageResolutionTime: number | null;
}

/**
 * Counts and measures the alerts shown in the history.
 *
 * @param alerts - The alerts that passed the filter
 * @returns The figures of those alerts
 *
 * @remarks
 * The averages only take the alerts that already have that time: an open alert does not lower the average resolution
 * time.
 */
export function summarizeAlertHistory(alerts: readonly DeviationAlert[]): AlertHistorySummary {
  const bySeverity: Record<AlertSeverity, number> = { LOW: 0, WARNING: 0, CRITICAL: 0 };
  for (const alert of alerts) bySeverity[alert.severity]++;
  const resolved = alerts.filter((alert) => alert.status === 'RESOLVED').length;
  return {
    total: alerts.length,
    bySeverity,
    resolved,
    resolvedPercent: alerts.length ? Math.round((resolved / alerts.length) * 100) : null,
    averageAttentionTime: average(alerts.map(attentionTime)),
    averageResolutionTime: average(alerts.map(resolutionTime)),
  };
}

/**
 * Average of the known values.
 *
 * @param values - The values, `null` where one is unknown
 * @returns The average of the values that are not `null`, or `null` when there is none
 */
function average(values: readonly (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  if (!known.length) return null;
  return known.reduce((sum, value) => sum + value, 0) / known.length;
}
