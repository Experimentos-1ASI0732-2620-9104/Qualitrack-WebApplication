import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EquipmentForm } from './equipment-form';

describe('EquipmentForm', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [EquipmentForm],
      providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(EquipmentForm);
    fixture.detectChanges();
    return (fixture.componentInstance as unknown as { form: import('@angular/forms').FormGroup }).form;
  }

  const valid = { name: 'Autoclave 1', type: 'Autoclave', model: 'AC-200', serialNumber: 'SN-1234' };

  it('accepts valid data', () => {
    const form = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it.each([
    ['name', '   ', 'notBlank'],
    ['name', 'ab', 'minlength'],
    ['model', '   ', 'notBlank'],
    ['serialNumber', 'SN 12', 'pattern'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const form = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });
});
