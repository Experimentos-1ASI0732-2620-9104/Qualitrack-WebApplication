import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { ReceiveBatchForm } from './receive-batch-form';

describe('ReceiveBatchForm', () => {
  const open = (changes: { receivedOn?: string; expiresOnError?: string } = {}) => {
    TestBed.configureTestingModule({ imports: [ReceiveBatchForm], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(ReceiveBatchForm);
    const form = new FormGroup({
      supplier: new FormControl('', { nonNullable: true }),
      batchNumber: new FormControl('', { nonNullable: true }),
      amount: new FormControl(1, { nonNullable: true }),
      receivedOn: new FormControl(changes.receivedOn ?? '', { nonNullable: true }),
      expiresOn: new FormControl('', {
        nonNullable: true,
        validators: changes.expiresOnError ? () => ({ [changes.expiresOnError as string]: true }) : [],
      }),
    });
    form.controls.expiresOn.markAsTouched();
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('unit', 'kg');
    fixture.componentRef.setInput('minDate', '2020-01-01');
    fixture.componentRef.setInput('maxReceiptDate', '2026-10-15');
    fixture.componentRef.setInput('maxExpiryDate', '2036-10-15');
    fixture.detectChanges();
    return fixture;
  };
  const dateInput = (element: HTMLElement, name: string) => element.querySelector(`[formcontrolname="${name}"]`) as HTMLInputElement;

  it('limits the dates with the values of the view', () => {
    const element = open().nativeElement as HTMLElement;
    expect(dateInput(element, 'receivedOn').getAttribute('min')).toBe('2020-01-01');
    expect(dateInput(element, 'receivedOn').getAttribute('max')).toBe('2026-10-15');
    expect(dateInput(element, 'expiresOn').getAttribute('max')).toBe('2036-10-15');
  });

  it('does not let the expiration come before the reception', () => {
    const element = open({ receivedOn: '2026-09-01' }).nativeElement as HTMLElement;
    expect(dateInput(element, 'expiresOn').getAttribute('min')).toBe('2026-09-01');
  });

  it('explains a wrong expiration', () => {
    const fixture = open({ expiresOnError: 'dateOrder' });
    // The field reads the error state of its control during the first check and shows the error in the next one.
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('mat-error')?.textContent).toBe('inventory.expiryBeforeReceipt');
  });

  it('warns about the quarantine and tells when the user saves or cancels', () => {
    const fixture = open();
    const events: string[] = [];
    fixture.componentInstance.saveRequested.subscribe(() => events.push('save'));
    fixture.componentInstance.cancelRequested.subscribe(() => events.push('cancel'));
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.notice')?.textContent).toBe('inventory.quarantineNotice');
    (element.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    (element.querySelector('button[type="button"]') as HTMLButtonElement).click();
    expect(events).toEqual(['save', 'cancel']);
  });
});
