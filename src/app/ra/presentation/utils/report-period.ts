import { DateValue, MIN_DATE, toIsoDate } from '../../../shared/presentation/validators/date.validators';
import { todayInLima } from '../../../shared/presentation/utils/local-date';

/** Longest period a report can cover: one year. */
export const MAX_REPORT_DAYS = 366;

/** What is wrong with a period of dates. */
export type PeriodError = 'minDate' | 'futureDate' | 'dateRange' | 'tooLong';

/** Translation keys of the messages for each {@link PeriodError}. */
export const PERIOD_ERROR_KEYS: Record<PeriodError, string> = {
  minDate: 'common.dateMin',
  futureDate: 'common.dateFuture',
  dateRange: 'common.dateRangeOrder',
  tooLong: 'common.periodTooLong',
};

/**
 * Builds the Date of a yyyy-MM-dd calendar day at local midnight, the way the date picker holds its dates.
 *
 * @param isoDate - The calendar day
 * @returns The Date of that day
 */
export function calendarDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Checks a period of dates chosen with a date range picker.
 *
 * @remarks
 * Both dates must be from 2020-01-01 up to today in Lima, the end cannot be before the start and, if a maximum is
 * given, the period cannot cover more days. If a date is missing nothing is reported, because the caller already
 * requires both to be filled in.
 *
 * @param start - First day of the period
 * @param end - Last day of the period
 * @param maxDays - Most days the period can cover, both ends included; no limit by default
 * @returns The first problem found, or null if the period is acceptable or incomplete
 */
export function periodError(start: DateValue, end: DateValue, maxDays?: number): PeriodError | null {
  const from = toIsoDate(start);
  const to = toIsoDate(end);
  if (!from || !to) return null;
  if (from < MIN_DATE || to < MIN_DATE) return 'minDate';
  const today = todayInLima();
  if (from > today || to > today) return 'futureDate';
  if (to < from) return 'dateRange';
  if (maxDays !== undefined) {
    const days = (calendarDate(to).getTime() - calendarDate(from).getTime()) / 86_400_000 + 1;
    if (Math.round(days) > maxDays) return 'tooLong';
  }
  return null;
}
