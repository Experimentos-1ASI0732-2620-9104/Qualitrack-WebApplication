import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { InventoryMovement } from '../../../domain/model/inventory-movement.entity';
import { InventoryMovementsTable } from './inventory-movements-table';

const movement = (changes: Partial<ConstructorParameters<typeof InventoryMovement>[0]>) => new InventoryMovement({
  id: 1, materialId: 2, receiptId: 11, productBatchId: null, type: 'RECEIPT', amount: 10, unit: 'kg', stockBefore: 0, stockAfter: 10,
  statusBefore: null, statusAfter: 'RELEASED', reason: 'Received', actorId: 27, occurredAt: '2026-09-13T15:00:00Z', ...changes,
});

describe('InventoryMovementsTable', () => {
  const open = (movements: InventoryMovement[]) => {
    TestBed.configureTestingModule({ imports: [InventoryMovementsTable], providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(InventoryMovementsTable);
    fixture.componentRef.setInput('movements', movements);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('signs the amount and links to the production batch only when there is one', () => {
    const element = open([movement({ id: 1, amount: 10 }), movement({ id: 2, amount: -4, productBatchId: 31 })]);
    const rows = element.querySelectorAll('tbody tr');
    expect(rows[0].querySelectorAll('td')[2].querySelector('small')?.textContent).toContain('+10');
    expect(rows[1].querySelectorAll('td')[2].querySelector('small')?.textContent).toContain('-4');
    expect(rows[0].querySelector('a')).toBeNull();
    expect(rows[1].querySelector('a')?.getAttribute('href')).toBe('/batches/31');
  });

  it('says so when there are no movements', () => {
    expect(open([]).querySelector('td[colspan="4"]')?.textContent).toBe('inventory.noMovements');
  });
});
