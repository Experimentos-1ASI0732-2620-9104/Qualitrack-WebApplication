import { FormControl } from '@angular/forms';
import { dniValidator } from './dni.validator';

describe('dniValidator', () => {
  const check = (value: unknown) => dniValidator(new FormControl(value));

  it('accepts 8 digits', () => {
    expect(check('72345678')).toBeNull();
  });

  it('leaves an empty value to the required validator', () => {
    expect(check('')).toBeNull();
    expect(check(null)).toBeNull();
  });

  it.each(['7234567', '723456789', '7234567a', '7234 5678', '-2345678'])('rejects %s as malformed', value =>
    expect(check(value)).toEqual({ dni: true }),
  );

  it.each(['00000000', '11111111', '99999999'])('rejects %s as made up', value =>
    expect(check(value)).toEqual({ dniFake: true }),
  );
});
