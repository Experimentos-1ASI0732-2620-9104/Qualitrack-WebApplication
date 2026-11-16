import { FormControl } from '@angular/forms';
import { rucValidator } from './ruc.validator';

describe('rucValidator', () => {
  const check = (value: unknown) => rucValidator(new FormControl(value));

  it('accepts a legal entity RUC', () => {
    expect(check('20123456789')).toBeNull();
  });

  it('leaves an empty value to the required validator', () => {
    expect(check('')).toBeNull();
    expect(check(null)).toBeNull();
  });

  it.each(['10123456789', '15123456789', '17123456789', '2012345678', '201234567890', '2012345678a', '20 12345678'])(
    'rejects %s',
    value => expect(check(value)).toEqual({ ruc: true }),
  );
});
