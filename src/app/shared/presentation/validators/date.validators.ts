import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { localIsoDate, todayInLima } from '../utils/local-date';

/** Earliest date any form accepts, in yyyy-MM-dd. */
export const MIN_DATE = '2020-01-01';

/** A date as the forms hold it: a yyyy-MM-dd text from a date input, or a Date from a date picker. */
export type DateValue = string | Date | null | undefined;

/**
 * Reads a form date as a yyyy-MM-dd text.
 *
 * @param value - The text of a date input or the Date of a date picker
 * @returns The calendar date, or null if the value is empty or is not a valid date
 */
export function toIsoDate(value: DateValue): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : localIsoDate(value);
  const text = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return localIsoDate(date) === text ? text : null;
}

/**
 * Moves a calendar date by whole years.
 *
 * @param isoDate - A yyyy-MM-dd date
 * @param years - Years to add; negative to subtract
 * @returns The shifted date; February 29 becomes March 1 in a year without leap day
 */
export function addYears(isoDate: string, years: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return localIsoDate(new Date(year + years, month - 1, day));
}

/**
 * Date not earlier than a minimum, 2020-01-01 by default.
 *
 * @remarks
 * An empty value is left to `Validators.required`.
 *
 * @param min - The earliest accepted date in yyyy-MM-dd
 * @returns A validator reporting `invalidDate` or `minDate`
 */
export function minDateValidator(min: string = MIN_DATE): ValidatorFn {
  return control => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') return null;
    const date = toIsoDate(raw);
    if (!date) return { invalidDate: true };
    return date < min ? { minDate: { min } } : null;
  };
}

/**
 * Date not later than a maximum, today in Lima by default.
 *
 * @remarks
 * An empty value is left to `Validators.required`. The maximum is read on every check, so it follows the clock.
 *
 * @param max - The latest accepted date in yyyy-MM-dd, or a function that returns it
 * @returns A validator reporting `invalidDate` or `maxDate`
 */
export function maxDateValidator(max: string | (() => string) = todayInLima): ValidatorFn {
  return control => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') return null;
    const date = toIsoDate(raw);
    if (!date) return { invalidDate: true };
    const limit = typeof max === 'function' ? max() : max;
    return date > limit ? { maxDate: { max: limit } } : null;
  };
}

/**
 * Date that is not in the future in Lima.
 *
 * @returns A validator reporting `invalidDate` or `futureDate`
 */
export function noFutureDateValidator(): ValidatorFn {
  const maxDate = maxDateValidator();
  return control => {
    const error = maxDate(control);
    return error?.['maxDate'] ? { futureDate: true } : error;
  };
}

/**
 * Date that comes after a reference date that may change, such as another field of the form.
 *
 * @remarks
 * If the reference is empty or not a date, nothing is checked here: that field reports its own error.
 *
 * @param reference - Function that returns the reference date
 * @param strict - True if the date cannot be the same day as the reference
 * @returns A validator reporting `invalidDate` or `dateOrder`
 */
export function afterDateValidator(reference: () => DateValue, strict = false): ValidatorFn {
  return control => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') return null;
    const date = toIsoDate(raw);
    if (!date) return { invalidDate: true };
    const base = toIsoDate(reference());
    if (!base) return null;
    return date > base || (!strict && date === base) ? null : { dateOrder: true };
  };
}

/**
 * Group validator for a pair of dates where the end cannot be before the start.
 *
 * @remarks
 * If either date is empty or not a date, nothing is checked here: that control reports its own error.
 *
 * @param startKey - Name of the start control in the group
 * @param endKey - Name of the end control in the group
 * @returns A validator reporting `dateRange` on the group
 */
export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = toIsoDate(group.get(startKey)?.value);
    const end = toIsoDate(group.get(endKey)?.value);
    return start && end && end < start ? { dateRange: true } : null;
  };
}
