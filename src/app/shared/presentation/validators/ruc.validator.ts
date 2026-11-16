import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Peruvian RUC of a legal entity: 11 digits starting with 20.
 *
 * @remarks
 * Only the format is checked; the check digit is not verified. An empty value is left to `Validators.required`.
 *
 * @param control - Control holding the RUC
 * @returns `{ ruc: true }` if the value is not a legal entity RUC, null otherwise
 */
export function rucValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return /^20\d{9}$/.test(value) ? null : { ruc: true };
}
