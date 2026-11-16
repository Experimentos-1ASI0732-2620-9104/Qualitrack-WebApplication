import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MaterialConsumption } from '../../../domain/model/material-consumption.entity';
import { LegacyMaterialHistoryTable } from './legacy-material-history-table';

describe('LegacyMaterialHistoryTable', () => {
  const open = (history: MaterialConsumption[]) => {
    TestBed.configureTestingModule({ imports: [LegacyMaterialHistoryTable], providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(LegacyMaterialHistoryTable);
    fixture.componentRef.setInput('history', history);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('links each consumption to its production batch', () => {
    const element = open([new MaterialConsumption({ id: 1, batchId: 8, quantityUsed: 4, unit: 'kg', usageDate: '2026-09-01' })]);
    expect(element.querySelector('tbody a')?.getAttribute('href')).toBe('/batches/8');
    expect(element.querySelectorAll('tbody td')[1].textContent).toBe('4 kg');
  });

  it('says so when there is no consumption', () => {
    expect(open([]).querySelector('td[colspan="3"]')?.textContent).toBe('inventory.noMovements');
  });
});
