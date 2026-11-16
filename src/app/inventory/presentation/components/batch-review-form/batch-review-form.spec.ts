import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { RawMaterialBatch, RawMaterialBatchStatus } from '../../../domain/model/raw-material-batch.entity';
import { BatchReviewForm } from './batch-review-form';

const receipt = (changes: Partial<ConstructorParameters<typeof RawMaterialBatch>[0]> = {}) => new RawMaterialBatch({
  id: 11, laboratoryId: 1, rawMaterialId: 2, supplier: 'Andino', batchNumber: 'SUP-1', unit: 'kg', initialAmount: 100, availableAmount: 40,
  receivedOn: '2026-09-01', expiresOn: '2028-01-01', status: 'RELEASED', ...changes,
});

describe('BatchReviewForm', () => {
  const open = (item: RawMaterialBatch) => {
    TestBed.configureTestingModule({ imports: [BatchReviewForm], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(BatchReviewForm);
    fixture.componentRef.setInput('receipt', item);
    fixture.componentRef.setInput('form', new FormGroup({
      status: new FormControl<RawMaterialBatchStatus>('RELEASED', { nonNullable: true }),
      reason: new FormControl('', { nonNullable: true }),
    }));
    fixture.detectChanges();
    return fixture;
  };
  const decisions = (item: RawMaterialBatch) => {
    const select = open(item).debugElement.query(By.directive(MatSelect)).componentInstance as MatSelect;
    return select.options.map((option) => option.value);
  };

  it.each([
    { name: 'a quarantined lot can be released or rejected', item: { status: 'QUARANTINED' as const }, expected: ['RELEASED', 'REJECTED'] },
    { name: 'an expired lot can only be rejected', item: { status: 'QUARANTINED' as const, availability: 'EXPIRED' }, expected: ['REJECTED'] },
    { name: 'a released lot can be observed or rejected', item: { status: 'RELEASED' as const }, expected: ['OBSERVED', 'REJECTED'] },
  ])('$name', ({ item, expected }) => {
    expect(decisions(receipt(item))).toEqual(expected);
  });

  it('tells when the user confirms or cancels', () => {
    const fixture = open(receipt());
    const events: string[] = [];
    fixture.componentInstance.confirmRequested.subscribe(() => events.push('confirm'));
    fixture.componentInstance.cancelRequested.subscribe(() => events.push('cancel'));
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    (element.querySelector('button[type="button"]') as HTMLButtonElement).click();
    expect(events).toEqual(['confirm', 'cancel']);
  });
});
