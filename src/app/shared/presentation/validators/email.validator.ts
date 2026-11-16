import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Same format the API applies: something, an @, and a domain that contains a dot. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * E-mail address whose domain has a dot, as the API requires.
 *
 * @remarks
 * `Validators.email` accepts `name@domain`; this one asks for `name@domain.ext`. An empty value is left to
 * `Validators.required`. It reports the same `email` error as the built-in one, so existing messages keep working.
 *
 * @param control - Control holding the e-mail
 * @returns `{ email: true }` if the value is not an e-mail address, null otherwise
 */
export function emailValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return EMAIL.test(value) ? null : { email: true };
}
