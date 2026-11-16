/**
 * Formats a date as yyyy-MM-dd in the browser time zone, the format expected by date inputs.
 *
 * @remarks
 * {@link Date.toISOString} uses UTC, so in the evening in Lima it already returns the next day.
 *
 * @param date - The date to format; today by default
 * @returns The local calendar date, for example 2026-10-02
 */
export function localIsoDate(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Time zone of the laboratories, which all operate in Peru. */
export const LABORATORY_TIME_ZONE = 'America/Lima';

/**
 * Today's calendar date in Lima, whatever the time zone of the browser.
 *
 * @remarks
 * Use it for "today" in validators and default values. {@link localIsoDate} stays the way to format a date the
 * user picked, because that date is already a calendar day in the browser time zone.
 *
 * @param now - The instant to read; the current time by default
 * @returns The calendar date in Lima, for example 2026-10-02
 */
export function todayInLima(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LABORATORY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
