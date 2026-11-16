import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { BatchStore } from '../../../application/batch.store';
import { BatchRejectForm } from './batch-reject-form';

describe('BatchRejectForm', () => {
  function create(startDate: string | null = '2026-09-01') {
    TestBed.configureTestingModule({
      imports: [BatchRejectForm],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: IamStore, useValue: { requireLaboratoryId: () => 1, canManageQuality: () => true, canOperate: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '5' } } } },
      ],
    });
    const store = TestBed.inject(BatchStore);
    vi.spyOn(store, 'selectedBatch').mockReturnValue(startDate ? ({ id: 5, startDate } as never) : null);
    const fixture = TestBed.createComponent(BatchRejectForm);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      form: import('@angular/forms').FormGroup;
      minDate: string;
      maxDate: string;
    };
  }

  const text = 'Out of specification result in assay';

  it('starts today and accepts a date from the start of the batch up to today', () => {
    const { form } = create();
    expect(form.get('rejectionDate')?.value).toBe(todayInLima());
    form.setValue({ rejectionDate: '2026-09-01', reason: text });
    expect(form.valid).toBe(true);
  });

  it.each([
    ['1900-01-01', 'minDate'],
    ['2019-12-31', 'minDate'],
    ['2999-01-01', 'futureDate'],
    ['2026-08-31', 'dateOrder'],
    ['2026-02-30', 'invalidDate'],
  ])('rejects the date %s with %s', (date, error) => {
    const { form } = create();
    form.setValue({ rejectionDate: date, reason: text });
    expect(form.get('rejectionDate')?.hasError(error)).toBe(true);
  });

  it('does not compare with the start of the batch while it is not loaded', () => {
    const { form } = create(null);
    form.setValue({ rejectionDate: '2020-01-01', reason: text });
    expect(form.get('rejectionDate')?.valid).toBe(true);
  });

  it('rejects text made only of spaces', () => {
    const { form } = create();
    form.setValue({ rejectionDate: '2026-09-01', reason: ' '.repeat(20) });
    expect(form.get('reason')?.hasError('notBlank')).toBe(true);
  });

  it('limits the date input from the start of the batch to today', () => {
    const component = create();
    expect(component.minDate).toBe('2026-09-01');
    expect(component.maxDate).toBe(todayInLima());
  });

  it('limits the date input to 2020 while the batch is not loaded', () => {
    expect(create(null).minDate).toBe('2020-01-01');
  });
});
