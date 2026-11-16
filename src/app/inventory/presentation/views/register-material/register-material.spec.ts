import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RegisterMaterial } from './register-material';

describe('RegisterMaterial', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [RegisterMaterial],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '3' } } } },
      ],
    });
    const fixture = TestBed.createComponent(RegisterMaterial);
    fixture.detectChanges();
    return fixture.componentInstance.form;
  }

  const valid = { code: 'MP-001', name: 'Paracetamol', unit: 'kg' as const, minimumStock: 10 };

  it('accepts valid data', () => {
    const form = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it.each([
    ['code', '   ', 'notBlank'],
    ['code', 'MP 001', 'code'],
    ['name', '   ', 'notBlank'],
    ['minimumStock', -1, 'min'],
    ['minimumStock', 1_000_000_000, 'max'],
    ['minimumStock', 1.2345, 'precision'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const form = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });

  it('checks the minimum stock against the unit, also when the unit changes', () => {
    const form = create();
    form.setValue({ ...valid, minimumStock: 2.5 });
    expect(form.controls.minimumStock.valid).toBe(true);
    form.controls.unit.setValue('units');
    expect(form.controls.minimumStock.hasError('wholeUnits')).toBe(true);
    form.controls.unit.setValue('mL');
    expect(form.controls.minimumStock.valid).toBe(true);
  });
});
