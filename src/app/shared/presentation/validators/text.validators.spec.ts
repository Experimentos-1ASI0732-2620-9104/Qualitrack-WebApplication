import { FormControl } from '@angular/forms';
import { codeValidator } from './code.validator';
import { emailValidator } from './email.validator';
import { notBlankValidator } from './not-blank.validator';
import { personNameValidator } from './person-name.validator';

describe('emailValidator', () => {
  const check = (value: unknown) => emailValidator(new FormControl(value));

  it.each(['juan@gmail.com', 'ana.perez@lab.com.pe', 'a+b@x.io'])('accepts %s', value =>
    expect(check(value)).toBeNull(),
  );

  it.each(['juan@gmail', 'juan@', '@gmail.com', 'juan gmail@x.com', 'juan@x .com', 'juan'])('rejects %s', value =>
    expect(check(value)).toEqual({ email: true }),
  );

  it('leaves an empty value to the required validator', () => {
    expect(check('')).toBeNull();
    expect(check(null)).toBeNull();
  });
});

describe('notBlankValidator', () => {
  const check = (value: unknown) => notBlankValidator(new FormControl(value));

  it('rejects text made only of spaces', () => {
    expect(check('   ')).toEqual({ notBlank: true });
    expect(check('\t')).toEqual({ notBlank: true });
  });

  it('accepts text and leaves an empty value to the required validator', () => {
    expect(check(' a ')).toBeNull();
    expect(check('')).toBeNull();
    expect(check(null)).toBeNull();
    expect(check(5)).toBeNull();
  });
});

describe('codeValidator', () => {
  const check = (value: unknown) => codeValidator(new FormControl(value));

  it.each(['MP-001', 'L-2026/07', 'abc123', 'SN_9.1', '7'])('accepts %s', value => expect(check(value)).toBeNull());

  it.each(['-MP', 'MP 001', 'MP#1', 'código', '/x', ' MP-001'])('rejects %s', value =>
    expect(check(value)).toEqual({ code: true }),
  );

  it('leaves an empty value to the required validator', () => {
    expect(check('')).toBeNull();
  });
});

describe('personNameValidator', () => {
  const check = (value: unknown) => personNameValidator(new FormControl(value));

  it.each(['Juan Pérez', 'Ñahui Quispe', "D'Angelo", 'Pérez-Gálvez', 'María J. Ramos', 'José'])('accepts %s', value =>
    expect(check(value)).toBeNull(),
  );

  it.each(['Juan3', '123', 'Juan_Perez', 'Juan@Perez', '-Juan', "'Juan"])('rejects %s', value =>
    expect(check(value)).toEqual({ personName: true }),
  );

  it('leaves an empty value to the required validator', () => {
    expect(check('')).toBeNull();
    expect(check('  ')).toBeNull();
  });
});
