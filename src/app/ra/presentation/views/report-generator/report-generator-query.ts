import { ParamMap } from '@angular/router';

import { ReportConfig, ReportType } from './report-generator.state';

/** Types of report that the address can choose. */
const REPORT_TYPES: readonly ReportType[] = ['batch', 'compliance', 'inventory', 'equipment'];

/** A day written as `YYYY-MM-DD`. */
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Reads from the address the values another view prepared for the report generator.
 *
 * @param query - The query parameters, for example `?type=compliance&environmentId=3&from=2026-09-01&to=2026-09-30`
 * @returns Only the values that are present and valid; the form keeps its own value for the rest
 *
 * @remarks
 * The alert history uses it to export its period and environment as an environmental compliance report.
 */
export function reportConfigFromQuery(query: ParamMap): Partial<ReportConfig> {
  const config: Partial<ReportConfig> = {};
  const type = REPORT_TYPES.find((item) => item === query.get('type'));
  if (type) config.type = type;
  const environmentId = Number(query.get('environmentId'));
  if (Number.isInteger(environmentId) && environmentId > 0) config.environmentId = environmentId;
  const startDate = dayFrom(query.get('from'));
  if (startDate) config.startDate = startDate;
  const endDate = dayFrom(query.get('to'));
  if (endDate) config.endDate = endDate;
  return config;
}

/**
 * Reads a day of the address as the date picker of the form writes it: midnight in the time of the browser.
 *
 * @param value - The parameter
 * @returns The date, or `null` when it is missing or is not a real day
 */
function dayFrom(value: string | null): Date | null {
  const parts = value ? DAY.exec(value) : null;
  if (!parts) return null;
  const [year, month, day] = [Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])];
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
}
