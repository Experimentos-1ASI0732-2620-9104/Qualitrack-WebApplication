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
