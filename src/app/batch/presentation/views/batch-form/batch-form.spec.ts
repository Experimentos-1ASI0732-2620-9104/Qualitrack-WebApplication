import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { addYears } from '../../../../shared/presentation/validators/date.validators';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { BatchStore } from '../../../application/batch.store';
import { BatchForm } from './batch-form';

describe('BatchForm', () => {
  const createBatch = vi.fn().mockResolvedValue(null);

  function create() {
    TestBed.configureTestingModule({
      imports: [BatchForm],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: IamStore, useValue: { requireLaboratoryId: () => 1, canManageQuality: () => true, canOperate: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '3' } } } },
      ],
    });
    vi.spyOn(TestBed.inject(BatchStore), 'loadProduct').mockResolvedValue(undefined as never);
    vi.spyOn(TestBed.inject(BatchStore), 'createBatch').mockImplementation(createBatch);
    const fixture = TestBed.createComponent(BatchForm);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      form: import('@angular/forms').FormGroup;
      save(): Promise<void>;
    };
  }

  const valid = { batchNumber: 'PB-2026-001', quantity: 10, unit: 'units', startDate: todayInLima(), notes: '' };

  beforeEach(() => createBatch.mockClear());

  it('accepts valid data and starts today', () => {
    const { form } = create();
    expect(form.get('startDate')?.value).toBe(todayInLima());
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it.each([
    ['batchNumber', '   ', 'notBlank'],
    ['batchNumber', 'PB 2026', 'code'],
    ['quantity', 0, 'min'],
    ['quantity', 1_000_000_000, 'max'],
    ['quantity', 2.5, 'wholeUnits'],
    ['startDate', '1900-01-01', 'minDate'],
    ['startDate', '2019-12-31', 'minDate'],
    ['startDate', '2999-01-01', 'maxDate'],
    ['startDate', '2026-02-30', 'invalidDate'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const { form } = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });

  it('accepts a start date from 2020 up to one year ahead', () => {
    const { form } = create();
    form.setValue({ ...valid, startDate: '2020-01-01' });
    expect(form.get('startDate')?.valid).toBe(true);
    form.setValue({ ...valid, startDate: addYears(todayInLima(), 1) });
    expect(form.get('startDate')?.valid).toBe(true);
  });

  it('checks the quantity against the unit, also when the unit changes', () => {
    const { form } = create();
    form.setValue({ ...valid, quantity: 2.5, unit: 'kg' });
    expect(form.get('quantity')?.valid).toBe(true);
    form.get('unit')?.setValue('units');
    expect(form.get('quantity')?.hasError('wholeUnits')).toBe(true);
    form.get('unit')?.setValue('g');
    expect(form.get('quantity')?.valid).toBe(true);
    form.get('quantity')?.setValue(1.2345);
    expect(form.get('quantity')?.hasError('precision')).toBe(true);
  });

  it('does not send an invalid batch', async () => {
    const component = create();
    component.form.setValue({ ...valid, quantity: 2.5 });
    await component.save();
    expect(createBatch).not.toHaveBeenCalled();
  });
});
