import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { addYears } from '../../../../shared/presentation/validators/date.validators';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryDetail } from './inventory-detail';

describe('InventoryDetail', () => {
  const receive = vi.fn().mockResolvedValue(false);

  function create(unit = 'kg') {
    TestBed.configureTestingModule({
      imports: [InventoryDetail],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ environmentId: '1', rawMaterialId: '2' })) } },
      ],
    });
    const fixture = TestBed.createComponent(InventoryDetail);
    const store = fixture.debugElement.injector.get(InventoryStore);
    vi.spyOn(store, 'load').mockResolvedValue(undefined as never);
    vi.spyOn(store, 'selected').mockReturnValue({ id: 2, unit, code: 'MP-001', name: 'Paracetamol' } as never);
    vi.spyOn(store, 'receive').mockImplementation(receive);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const receipt = { supplier: 'Acme', batchNumber: 'L-2026/07', amount: 5, receivedOn: '2026-09-01', expiresOn: '2027-09-01' };

  beforeEach(() => receive.mockClear());

  it('accepts a valid receipt', () => {
    const { receiptForm } = create();
    receiptForm.setValue(receipt);
    expect(receiptForm.valid).toBe(true);
  });

  it.each([
    ['supplier', '   ', 'notBlank'],
    ['batchNumber', 'L 2026', 'code'],
    ['batchNumber', '   ', 'notBlank'],
    ['amount', 1_000_000_000, 'max'],
    ['receivedOn', '1900-01-01', 'minDate'],
    ['receivedOn', '2019-12-31', 'minDate'],
    ['receivedOn', '2999-01-01', 'futureDate'],
    ['receivedOn', '2026-02-30', 'invalidDate'],
    ['expiresOn', '2019-12-31', 'minDate'],
    ['expiresOn', '2026-08-31', 'dateOrder'],
    ['expiresOn', '2026-09-01', 'dateOrder'],
  ])('rejects the receipt %s = %j with %s', (field, value, error) => {
    const { receiptForm } = create();
    receiptForm.setValue({ ...receipt, [field]: value });
    expect(receiptForm.get(field)?.hasError(error)).toBe(true);
  });

  it('accepts an expiration up to ten years ahead and rejects a later one', () => {
    const { receiptForm } = create();
    receiptForm.setValue({ ...receipt, expiresOn: addYears(todayInLima(), 10) });
    expect(receiptForm.get('expiresOn')?.valid).toBe(true);
    receiptForm.setValue({ ...receipt, expiresOn: addYears(todayInLima(), 11) });
    expect(receiptForm.get('expiresOn')?.hasError('maxDate')).toBe(true);
  });

  it('checks the expiration again when the reception date changes', () => {
    const { receiptForm } = create();
    receiptForm.setValue({ ...receipt, receivedOn: '2026-01-01', expiresOn: '2026-06-01' });
    expect(receiptForm.get('expiresOn')?.valid).toBe(true);
    receiptForm.get('receivedOn')?.setValue('2026-09-01');
    expect(receiptForm.get('expiresOn')?.hasError('dateOrder')).toBe(true);
  });

  it('checks the received amount against the unit of the material', async () => {
    const component = create('units');
    component.receiptForm.setValue({ ...receipt, amount: 2.5 });
    await component.receive();
    expect(receive).not.toHaveBeenCalled();
    expect(component.receiptForm.controls.amount.hasError('wholeUnits')).toBe(true);
    component.receiptForm.setValue({ ...receipt, amount: 3 });
    await component.receive();
    expect(receive).toHaveBeenCalled();
  });

  it('validates the material data', () => {
    const { metadata } = create();
    metadata.setValue({ code: 'MP-001', name: 'Paracetamol', minimumStock: 10 });
    expect(metadata.valid).toBe(true);
    metadata.setValue({ code: 'MP 001', name: '   ', minimumStock: 1_000_000_000 });
    expect(metadata.controls.code.hasError('code')).toBe(true);
    expect(metadata.controls.name.hasError('notBlank')).toBe(true);
    expect(metadata.controls.minimumStock.hasError('max')).toBe(true);
  });

  it('rejects a review reason made only of spaces', () => {
    const { reviewForm } = create();
    reviewForm.setValue({ status: 'REJECTED', reason: '   ' });
    expect(reviewForm.controls.reason.hasError('notBlank')).toBe(true);
  });
});
