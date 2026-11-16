import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Letters and digits, optionally separated by hyphens, underscores, dots or slashes, such as MP-001 or L-2026/07. */
const CODE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/**
 * Code or serial number: letters, digits and the separators - _ . /, starting with a letter or a digit.
 *
 * @remarks
 * Spaces and other symbols are rejected. An empty value is left to `Validators.required`.
 *
 * @param control - Control holding the code
 * @returns `{ code: true }` if the value is not a valid code, null otherwise
 */
export function codeValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return null;
  return CODE.test(value) ? null : { code: true };
}
