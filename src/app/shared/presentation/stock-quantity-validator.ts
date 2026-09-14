import { ValidatorFn } from '@angular/forms';

export function stockQuantityValidator(unit: string): ValidatorFn {
  return control => {
    if (control.value === null || control.value === '') return null;
    const value = Number(control.value);
    if (!Number.isFinite(value)) return { precision: true };
    if (['units', 'unit', 'unidades', 'unidad'].includes(unit.toLowerCase()) && !Number.isInteger(value)) {
      return { wholeUnits: true };
    }
    return Math.abs(value * 1000 - Math.round(value * 1000)) > 0.000001 ? { precision: true } : null;
  };
}
