import { TranslateService } from '@ngx-translate/core';

/**
 * Translated name of a monitored variable, or the stored name when it is not a known metric.
 *
 * @param translate - The translation service
 * @param parameterName - The variable of the alert, for example `TEMPERATURE`
 * @returns The translation of `tracking.metrics.{parameterName}`, or `parameterName` when there is none
 */
export function alertVariableName(translate: TranslateService, parameterName: string): string {
  const key = 'tracking.metrics.' + parameterName;
  const label = translate.instant(key);
  return label === key ? parameterName : label;
}
