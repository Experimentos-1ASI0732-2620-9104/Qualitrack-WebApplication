import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ProductForm } from './product-form';

describe('ProductForm', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [ProductForm],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '3' } } } },
      ],
    });
    const fixture = TestBed.createComponent(ProductForm);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as { form: import('@angular/forms').FormGroup };
  }

  const valid = { code: 'MP-001', name: 'Paracetamol 500 mg', description: '', specifications: 'Tablets, 500 mg' };

  it('accepts valid data', () => {
    const { form } = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it.each([
    ['code', '   ', 'notBlank'],
    ['code', 'MP 001', 'code'],
    ['code', 'MP#001', 'code'],
    ['name', '   ', 'notBlank'],
    ['specifications', '   ', 'notBlank'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const { form } = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });
});
