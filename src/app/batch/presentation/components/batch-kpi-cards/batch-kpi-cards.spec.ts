import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Batch, BatchStatus } from '../../../domain/model/batch.entity';
import { BatchKpiCards } from './batch-kpi-cards';

describe('BatchKpiCards', () => {
  function batch(id: number, status: BatchStatus, productId = 5): Batch {
    return new Batch({
      id,
      labId: 42,
      environmentId: 1,
      productId,
      productName: 'Product',
      batchNumber: `LOT-${id}`,
      quantity: 10,
      unit: 'units',
      status,
      startDate: '2026-10-01',
    });
  }

  function create(selected: BatchStatus | '' = '') {
    TestBed.configureTestingModule({
      imports: [BatchKpiCards],
      providers: [provideTranslateService()],
    });
    const fixture = TestBed.createComponent(BatchKpiCards);
    fixture.componentRef.setInput('batches', [
      batch(1, 'PENDING'),
      batch(2, 'RELEASED', 6),
      batch(3, 'RELEASED'),
      batch(4, 'RELEASED'),
      batch(5, 'REJECTED'),
    ]);
    fixture.componentRef.setInput('selected', selected);
    fixture.detectChanges();
    const cards = [
      ...fixture.nativeElement.querySelectorAll('button.filter-chip'),
    ] as HTMLButtonElement[];
    const chosen = vi.fn();
    fixture.componentInstance.statusSelected.subscribe(chosen);
    return { cards, chosen };
  }

  it('counts every batch and each status in its chip', () => {
    const { cards } = create();

    expect(cards.map((card) => card.querySelector('.count')?.textContent)).toEqual([
      '5',
      '1',
      '0',
      '3',
      '1',
    ]);
    expect(cards[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('filters by a status and shows every status when the active one is chosen again', () => {
    const { cards, chosen } = create('RELEASED');

    expect(cards[3].getAttribute('aria-pressed')).toBe('true');
    cards[1].click();
    cards[3].click();
    cards[0].click();

    expect(chosen.mock.calls).toEqual([['PENDING'], [''], ['']]);
  });
});
