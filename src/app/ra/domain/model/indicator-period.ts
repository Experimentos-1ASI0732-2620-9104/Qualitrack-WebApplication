/**
 * Value of the "All environments" option of the indicators and reports; mat-select shows no option for null.
 */
export const ALL_ENVIRONMENTS = 0;

/** Period of the indicators, in ISO-8601 instants (at most 31 days). */
export interface IndicatorPeriod {
  from: string;
  to: string;
}

/**
 * Period of the last days until now.
 *
 * @param days - Length of the period in days
 */
export function lastDays(days: number): IndicatorPeriod {
  const to = new Date();
  return { from: new Date(to.getTime() - days * 24 * 60 * 60 * 1000).toISOString(), to: to.toISOString() };
}
