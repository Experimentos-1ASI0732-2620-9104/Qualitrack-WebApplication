import { FormControl } from '@angular/forms';
import { normalizePhone, phoneValidator, sanitizePhoneInput } from './phone.validator';

describe('phoneValidator', () => {
  const check = (value: unknown) => phoneValidator(new FormControl(value));

  it('leaves an empty value to the required validator', () => {
    expect(check('')).toBeNull();
    expect(check('   ')).toBeNull();
    expect(check(null)).toBeNull();
  });

  it.each(['987654320', '987 654 320', '+51 987 654 320', '+51987654320', '(01) 234-5679', '012345679', '01 2345679', '+51 12345670'])(
    'accepts %s',
    value => expect(check(value)).toBeNull(),
  );

  it.each(['98765432', '9876543201', '887654320', '+52987654320', '+51 0123456780', '+5101234567', '0912345678', '012', '987 65 43 2'])(
    'rejects %s for its format',
    value => expect(check(value)).toEqual({ phone: true }),
  );

  it.each(['abc', '98765432a', '987-654-32#', '9876+54320', '+51 987 654 32x'])('rejects %s for its characters', value =>
    expect(check(value)).toEqual({ phoneChars: true }),
  );

  it.each(['999999999', '900000000', '911111111', '11111111', '22222222'])('rejects %s as repeated', value =>
    expect(check(value)).toEqual({ phoneFake: true }),
  );

  it.each(['912345678', '923456789', '987654321', '12345678', '87654321', '(01) 234-5678', '012345678'])('rejects %s as a sequence', value =>
    expect(check(value)).toEqual({ phoneFake: true }),
  );
});

describe('normalizePhone', () => {
  it.each([
    ['987 654 320', '+51987654320'],
    ['+51 987 654 320', '+51987654320'],
    ['(01) 234-5679', '+5112345679'],
    ['012345679', '+5112345679'],
    ['12345670', '+5112345670'],
  ])('turns %s into %s', (value, expected) => expect(normalizePhone(value)).toBe(expected));

  it('returns null for a number that is not valid', () => {
    expect(normalizePhone('hello')).toBeNull();
    expect(normalizePhone('999999999')).toBeNull();
  });
});

describe('sanitizePhoneInput', () => {
  it('removes letters and symbols', () => {
    expect(sanitizePhoneInput('98a7-6#5 (4)')).toBe('987-65 (4)');
  });

  it('keeps a + only as the first character', () => {
    expect(sanitizePhoneInput('+51+987')).toBe('+51987');
    expect(sanitizePhoneInput('51+987')).toBe('51987');
  });
});
