import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EquipmentStore } from '../../../application/equipment.store';
import { BpmConfigForm } from './bpm-config-form';

describe('BpmConfigForm', () => {
  const configureBpm = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [BpmConfigForm],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '4' } } } },
      ],
    });
    vi.spyOn(TestBed.inject(EquipmentStore), 'configureBpm').mockImplementation(configureBpm);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(BpmConfigForm);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      form: import('@angular/forms').FormGroup;
      onSave(): void;
    };
  }

  const valid = { parameterName: 'TEMPERATURE', minValue: 2, maxValue: 8, unit: 'Celsius' };

  beforeEach(() => configureBpm.mockClear());

  it('accepts valid data, including negative limits', () => {
    const { form } = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
    form.setValue({ ...valid, minValue: -80, maxValue: -60 });
    expect(form.valid).toBe(true);
  });

  it.each([
    [{ minValue: 8, maxValue: 8 }],
    [{ minValue: 9, maxValue: 8 }],
    [{ minValue: 2.5, maxValue: -1 }],
  ])('rejects the range %j', range => {
    const { form } = create();
    form.setValue({ ...valid, ...range });
    expect(form.hasError('bpmRange')).toBe(true);
  });

  it.each([
    ['parameterName', '   ', 'notBlank'],
    ['parameterName', 'x'.repeat(101), 'maxlength'],
    ['unit', '   ', 'notBlank'],
    ['unit', 'x'.repeat(21), 'maxlength'],
    ['minValue', -1_000_001, 'min'],
    ['maxValue', 1_000_001, 'max'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const { form } = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });

  it('does not send a range where the minimum is not lower than the maximum', () => {
    const component = create();
    component.form.setValue({ ...valid, minValue: 8, maxValue: 2 });
    component.onSave();
    expect(configureBpm).not.toHaveBeenCalled();
  });

  it('sends a valid configuration', () => {
    const component = create();
    component.form.setValue(valid);
    component.onSave();
    expect(configureBpm).toHaveBeenCalled();
  });
});
