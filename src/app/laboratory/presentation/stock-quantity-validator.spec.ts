import { FormControl } from '@angular/forms';
import { stockQuantityValidator } from './stock-quantity-validator';

describe('Stock quantity precision', () => {
  it('accepts fractional kg and liters without rounding', () => {
    for (const unit of ['kg', 'L', 'mL', 'g']) {
      expect(stockQuantityValidator(unit)(new FormControl(0.125))).toBeNull();
    }
  });
  it('rejects fractional countable units', () => {
    expect(stockQuantityValidator('units')(new FormControl(0.5))).toEqual({ wholeUnits: true });
  });
  it('rejects excess precision and nonfinite values', () => {
    for (const value of [0.0001, NaN, Infinity]) {
      expect(stockQuantityValidator('kg')(new FormControl(value))).toEqual({ precision: true });
    }
  });
});
