import { DeviationAlert } from './deviation-alert.entity';

/** Position of an alert in the order of attention: the lower, the more urgent. */
function urgencyOf(alert: DeviationAlert): number {
  if (alert.severity === 'CRITICAL') return alert.status === 'UNRESOLVED' ? 0 : 1;
  return alert.severity === 'WARNING' ? 2 : 3;
}

/**
 * Compares alerts by urgency: critical unattended, critical being attended, warnings and low; the oldest goes first
 * within each group, because it has been waiting the longest.
 *
 * @param first - One alert
 * @param second - The other alert
 * @returns A negative number when `first` is more urgent, as `Array.prototype.sort` expects
 */
export function compareAlertsByPriority(first: DeviationAlert, second: DeviationAlert): number {
  return (
    urgencyOf(first) - urgencyOf(second) ||
    Date.parse(first.timestamp) - Date.parse(second.timestamp)
  );
}

/**
 * Compares alerts by when their incident started, the latest first.
 *
 * @param first - One alert
 * @param second - The other alert
 * @returns A negative number when `first` started later, as `Array.prototype.sort` expects
 */
export function compareAlertsByNewest(first: DeviationAlert, second: DeviationAlert): number {
  return Date.parse(second.timestamp) - Date.parse(first.timestamp);
}
