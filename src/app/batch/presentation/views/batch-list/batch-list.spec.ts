import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { Batch, BatchStatus } from '../../../domain/model/batch.entity';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchList } from './batch-list';

describe('BatchList', () => {
  function batch(id: number, status: BatchStatus): Batch {
    return new Batch({
      id,
      labId: 42,
      environmentId: 1,
      productId: 5,
      productName: 'Ibuprofen 400 mg',
      batchNumber: `LOT-${id}`,
      quantity: 100,
      unit: 'units',
      status,
      startDate: '2026-10-01',
    });
  }

  function create(batches: Batch[], loading = false) {
    const loadBatches = vi.fn();
    TestBed.configureTestingModule({
      imports: [BatchList],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        {
          provide: BatchStore,
          useValue: {
            batches: signal(batches),
            environments: signal([
              { id: 1, code: 'PRD-01', name: 'Production', usage: 'PRODUCTION' },
            ]),
            isLoading: signal(loading),
            error: signal(null),
            loadBatches,
            loadEnvironments: () => Promise.resolve(),
          },
        },
        { provide: IamStore, useValue: { requireLaboratoryId: () => 42 } },
      ],
    });
    const fixture = TestBed.createComponent(BatchList);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, loadBatches };
  }

  it('loads the batches of the laboratory', () => {
    const { loadBatches } = create([]);

    expect(loadBatches).toHaveBeenCalledWith(42);
  });

  it('filters the table through the indicators and offers to clear the filters when nothing matches', () => {
    const { fixture, element } = create([
      batch(1, 'PENDING'),
      batch(2, 'RELEASED'),
      batch(3, 'RELEASED'),
    ]);
    const cards = () =>
      [...element.querySelectorAll('app-batch-kpi-cards button.filter-chip')] as HTMLButtonElement[];

    expect(element.querySelectorAll('tr[mat-row]').length).toBe(3);

    cards()[3].click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tr[mat-row]').length).toBe(2);

    cards()[2].click();
    fixture.detectChanges();
    expect(element.querySelector('tr[mat-row]')).toBeNull();
    expect(element.textContent).toContain('batches.empty-state.no-match-title');

    (element.querySelector('app-empty-state button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tr[mat-row]').length).toBe(3);
  });

  it('shows a spinner on the first load and an empty state when the laboratory has no batches', () => {
    expect(create([], true).element.querySelector('mat-spinner')).not.toBeNull();
    TestBed.resetTestingModule();
    const { element } = create([]);
    expect(element.querySelector('mat-spinner')).toBeNull();
    expect(element.textContent).toContain('batches.empty-state.none-title');
  });
});
