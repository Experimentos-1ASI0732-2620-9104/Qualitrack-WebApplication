import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Peruvian DNI: exactly 8 digits that are not all the same.
 *
 * @remarks
 * An empty value is left to `Validators.required`, so the control stays optional where it is not required.
 *
 * @param control - Control holding the DNI
 * @returns `{ dni: true }` if the value is not 8 digits, `{ dniFake: true }` if all digits are equal, null otherwise
 */
export function dniValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  if (!/^\d{8}$/.test(value)) return { dni: true };
  return /^(\d)\1{7}$/.test(value) ? { dniFake: true } : null;
}
