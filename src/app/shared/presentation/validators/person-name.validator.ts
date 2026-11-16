import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Starts with a letter, then letters (with accents), spaces, apostrophes, hyphens and dots. */
const PERSON_NAME = /^\p{L}[\p{L}\p{M}'’. -]*$/u;

/**
 * Name of a person: letters with their accents and ñ, spaces, apostrophes, hyphens and dots.
 *
 * @remarks
 * Digits and other symbols are rejected, so Ñahui, D'Angelo and Pérez-Gálvez pass. An empty value is left to
 * `Validators.required`.
 *
 * @param control - Control holding the name
 * @returns `{ personName: true }` if the value is not a person's name, null otherwise
 */
export function personNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return PERSON_NAME.test(value) ? null : { personName: true };
}
