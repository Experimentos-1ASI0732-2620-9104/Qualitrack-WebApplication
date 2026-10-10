import { ValidatorFn } from '@angular/forms';
import { stockQuantityViolation } from '../../domain/model/stock-unit';

/**
 * Form validator that applies the stock quantity rules of the unit.
 *
 * @param unit - The unit the stock is recorded in
 * @returns A validator reporting `wholeUnits` or `precision` errors
 */
export function stockQuantityValidator(unit: string): ValidatorFn {
  return control => {
    if (control.value === null || control.value === '') return null;
    const violation = stockQuantityViolation(Number(control.value), unit);
    return violation ? { [violation]: true } : null;
  };
}
