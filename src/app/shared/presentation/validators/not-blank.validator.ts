import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Text that has something besides spaces.
 *
 * @remarks
 * `Validators.required` accepts a value made only of spaces. An empty value is left to `Validators.required`.
 *
 * @param control - Control holding the text
 * @returns `{ notBlank: true }` if the text is only spaces, null otherwise
 */
export function notBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || value === '') return null;
  return value.trim() ? null : { notBlank: true };
}
