import { LABORATORY_TIME_ZONE } from './local-date';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;

/** A date without time, as the platform sends the days of the calendar. */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Formatters by locale; building an `Intl` formatter is expensive and these run on every change detection. */
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();
const elapsedTimeFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Locale that formats the dates of an application language.
 *
 * @param language - The language of the application, for example `es`
 * @returns `es-PE` for Spanish and `en-US` for any other language
 */
function localeOf(language: string): string {
  return language.startsWith('es') ? 'es-PE' : 'en-US';
}

/**
 * Formats an instant the same way everywhere: in 24 hours, in the time zone of the laboratories.
 *
 * @param value - The instant to format
 * @param language - The language of the application
 * @returns For example `3 oct 2026, 09:00` or `Oct 3, 2026, 09:00`; an empty text when there is no valid instant
 *
 * @remarks
 * The dot that `es-PE` puts after the short month is removed, so the format matches the style guide.
 */
export function formatDateTime(value: string | Date | null | undefined, language: string): string {
  const instant = toValidDate(value);
  if (!instant) return '';
  const locale = localeOf(language);
  let formatter = dateTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      timeZone: LABORATORY_TIME_ZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    dateTimeFormatters.set(locale, formatter);
  }
  return formatter.format(instant).replace('.', '');
}

/**
 * Formats a calendar day the same way everywhere, without the time.
 *
 * @param value - The instant, or a `yyyy-MM-dd` calendar day
 * @param language - The language of the application
 * @returns For example `3 oct 2026` or `Oct 3, 2026`; an empty text when there is no valid date
 *
 * @remarks
 * A calendar day has no time zone: it is shown as it is, while an instant shows its day in the time zone of the
 * laboratories.
 */
export function formatDate(value: string | Date | null | undefined, language: string): string {
  const instant = toValidDate(value);
  if (!instant) return '';
  const timeZone = typeof value === 'string' && CALENDAR_DAY.test(value) ? 'UTC' : LABORATORY_TIME_ZONE;
  const locale = localeOf(language);
  const key = `${locale}|${timeZone}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'short', year: 'numeric' });
    dateFormatters.set(key, formatter);
  }
  return formatter.format(instant).replace('.', '');
}

/**
 * Tells how long ago an instant was, in the largest unit that fits.
 *
 * @param value - The instant to compare
 * @param language - The language of the application
 * @param now - The current instant; the current time by default
 * @returns For example `hace 28 días` or `5 minutes ago`; an empty text when there is no valid instant
 *
 * @remarks
 * An instant slightly ahead of the browser clock reads as the present.
 */
export function formatRelativeTime(
  value: string | Date | null | undefined,
  language: string,
  now: Date = new Date(),
): string {
  const instant = toValidDate(value);
  if (!instant) return '';
  const locale = localeOf(language);
  let formatter = relativeTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    relativeTimeFormatters.set(locale, formatter);
  }
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - instant.getTime()) / 1000));
  if (elapsedSeconds < SECONDS_PER_MINUTE) return formatter.format(-elapsedSeconds, 'second');
  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return formatter.format(-Math.floor(elapsedSeconds / SECONDS_PER_MINUTE), 'minute');
  }
  if (elapsedSeconds < SECONDS_PER_DAY) {
    return formatter.format(-Math.floor(elapsedSeconds / SECONDS_PER_HOUR), 'hour');
  }
  return formatter.format(-Math.floor(elapsedSeconds / SECONDS_PER_DAY), 'day');
}

/**
 * Tells how long passed between two instants, in the largest unit that fits.
 *
 * @param from - The first instant
 * @param to - The later instant
 * @param language - The language of the application
 * @returns For example `14 min` or `2 hours`; an empty text when an instant is missing or invalid
 */
export function formatElapsedTime(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined,
  language: string,
): string {
  const start = toValidDate(from);
  const end = toValidDate(to);
  if (!start || !end) return '';
  const elapsedSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  if (elapsedSeconds < SECONDS_PER_MINUTE) return elapsedFormatter(language, 'second').format(elapsedSeconds);
  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return elapsedFormatter(language, 'minute').format(Math.floor(elapsedSeconds / SECONDS_PER_MINUTE));
  }
  if (elapsedSeconds < SECONDS_PER_DAY) {
    return elapsedFormatter(language, 'hour').format(Math.floor(elapsedSeconds / SECONDS_PER_HOUR));
  }
  return elapsedFormatter(language, 'day').format(Math.floor(elapsedSeconds / SECONDS_PER_DAY));
}

/**
 * Formatter of an amount of time in a unit.
 *
 * @param language - The language of the application
 * @param unit - The unit of the amount
 * @returns The formatter, built only once per locale and unit
 */
function elapsedFormatter(language: string, unit: string): Intl.NumberFormat {
  const key = `${localeOf(language)}:${unit}`;
  let formatter = elapsedTimeFormatters.get(key);
  if (!formatter) {
    // Spanish abbreviates days as `dd.`, which nobody reads as days, so only the small units are abbreviated.
    const unitDisplay = unit === 'second' || unit === 'minute' ? 'short' : 'long';
    formatter = new Intl.NumberFormat(localeOf(language), { style: 'unit', unit, unitDisplay });
    elapsedTimeFormatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Reads an instant, discarding what is missing or cannot be read.
 *
 * @param value - The instant, as a date or as a text the `Date` constructor understands
 * @returns The date, or `null` when there is none
 */
function toValidDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? null : instant;
}
