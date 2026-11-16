import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Characters a phone number may contain: digits, spaces, hyphens and parentheses, with a leading + allowed. */
const ALLOWED_CHARACTERS = /^\+?[0-9 ()-]+$/;

/** Mobile number: 9 digits starting with 9. */
const MOBILE = /^9\d{8}$/;

/** Landline: area code and number in 8 digits, with an optional leading 0 (national dialing prefix). */
const LANDLINE = /^0?([1-8]\d{7})$/;

/**
 * Outcome of reading a phone number typed by the user.
 */
type PhoneReading =
  | { readonly kind: 'chars' | 'format' | 'fake' }
  | { readonly kind: 'ok'; readonly normalized: string };

/**
 * Reads a Peruvian mobile or landline number and builds its international form.
 *
 * @remarks
 * Spaces, hyphens and parentheses are ignored and the +51 prefix is optional. A landline written with the national
 * 0 (for example `(01) 234-5678`) is accepted, but the 0 is dropped in the result. Numbers whose digits repeat or
 * form an obvious sequence are reported as fake.
 *
 * @param value - The text typed by the user
 * @returns The reason the number is rejected, or the normalized number
 */
function readPhone(value: string): PhoneReading {
  const text = value.trim();
  if (!ALLOWED_CHARACTERS.test(text)) return { kind: 'chars' };
  const digits = text.replace(/\D/g, '');
  const international = text.startsWith('+');
  if (international && !digits.startsWith('51')) return { kind: 'format' };
  const national = international ? digits.slice(2) : digits;
  let number: string | null = null;
  if (MOBILE.test(national)) number = national;
  else number = (international ? /^([1-8]\d{7})$/ : LANDLINE).exec(national)?.[1] ?? null;
  if (!number) return { kind: 'format' };
  const body = MOBILE.test(number) ? number.slice(1) : number;
  return isFakeBody(body) ? { kind: 'fake' } : { kind: 'ok', normalized: `+51${number}` };
}

/**
 * Tells whether the digits of a number repeat a single digit or run in a sequence of +1 or -1 steps.
 *
 * @param body - The digits after the leading 9 of a mobile number, or the 8 digits of a landline
 * @returns True if the digits look made up
 */
function isFakeBody(body: string): boolean {
  if (/^(\d)\1+$/.test(body)) return true;
  const steps = [...body].slice(1).map((digit, index) => Number(digit) - Number(body[index]));
  return steps.every(step => step === 1) || steps.every(step => step === -1);
}

/**
 * Keeps only the characters a phone number may contain.
 *
 * @param value - The text typed or pasted by the user
 * @returns The text without letters or symbols; a + is kept only as the first character
 */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^0-9 ()+-]/g, '');
  return cleaned.charAt(0) === '+' ? `+${cleaned.slice(1).replace(/\+/g, '')}` : cleaned.replace(/\+/g, '');
}

/**
 * Builds the international form of a Peruvian phone number, the one sent to the API.
 *
 * @param value - The text typed by the user
 * @returns The number as +51 followed by 9 digits (mobile) or 8 digits (landline), or null if it is not valid
 */
export function normalizePhone(value: string): string | null {
  const reading = readPhone(value);
  return reading.kind === 'ok' ? reading.normalized : null;
}

/**
 * Peruvian mobile or landline phone number.
 *
 * @remarks
 * An empty value is left to `Validators.required`, so the control stays optional where it is not required.
 *
 * @param control - Control holding the phone number
 * @returns `{ phoneChars: true }` for characters that are not allowed, `{ phone: true }` for a wrong format,
 *   `{ phoneFake: true }` for a repeated or sequential number, null otherwise
 */
export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value.trim()) return null;
  const reading = readPhone(value);
  if (reading.kind === 'ok') return null;
  return { [reading.kind === 'chars' ? 'phoneChars' : reading.kind === 'fake' ? 'phoneFake' : 'phone']: true };
}
