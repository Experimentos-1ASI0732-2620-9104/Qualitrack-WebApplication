import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ConsumingBatch } from '../../../domain/model/consuming-batch.entity';
import { MaterialConsumption } from '../../../domain/model/material-consumption.entity';
import { LegacyConsumptionHistoryTable } from './legacy-consumption-history-table';

describe('LegacyConsumptionHistoryTable', () => {
  const open = (consumptions: MaterialConsumption[]) => {
    TestBed.configureTestingModule({ imports: [LegacyConsumptionHistoryTable], providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(LegacyConsumptionHistoryTable);
    fixture.componentRef.setInput('consumptions', consumptions);
    fixture.componentRef.setInput('batches', [new ConsumingBatch({ id: 8, batchNumber: 'PB-8' })]);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the number of a known production batch and the identifier of an unknown one', () => {
    const links = open([
      new MaterialConsumption({ id: 1, batchId: 8, quantityUsed: 4, unit: 'kg', usageDate: '2026-09-01' }),
      new MaterialConsumption({ id: 2, batchId: 99, quantityUsed: 2, unit: 'kg', usageDate: '2026-08-01' }),
    ]).querySelectorAll('tbody a');
    expect(links[0].textContent).toBe('PB-8');
    expect(links[0].getAttribute('href')).toBe('/batches/8');
    expect(links[1].textContent).toBe('#99');
  });

  it('tells recorded balances from the ones that were not recorded', () => {
    const rows = open([
      new MaterialConsumption({ id: 1, batchId: 8, quantityUsed: 4, unit: 'kg', usageDate: '2026-09-01', stockBefore: 4, stockAfter: 0 }),
      new MaterialConsumption({ id: 2, batchId: 8, quantityUsed: 2, unit: 'kg', usageDate: '2026-08-01' }),
    ]).querySelectorAll('tbody tr');
    expect(rows[0].querySelectorAll('td')[4].textContent).toBe('0 kg');
    expect(rows[0].querySelector('small')).toBeNull();
    expect(rows[1].querySelectorAll('td')[4].textContent).toBe('material-history.unrecorded');
    expect(rows[1].querySelector('small')?.textContent).toBe('material-history.legacy');
  });
});
