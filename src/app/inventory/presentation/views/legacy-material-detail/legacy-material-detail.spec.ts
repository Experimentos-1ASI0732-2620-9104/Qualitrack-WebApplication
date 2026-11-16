import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { InventoryStore } from '../../../application/inventory.store';
import { LegacyMaterialSnapshot } from '../../../domain/model/legacy-material-snapshot.entity';
import { ConsumingBatch } from '../../../domain/model/consuming-batch.entity';
import { MaterialConsumption } from '../../../domain/model/material-consumption.entity';
import { LegacyMaterialDetail } from './legacy-material-detail';

describe('LegacyMaterialDetail', () => {
  const params = new BehaviorSubject(convertToParamMap({ id: '3' }));
  const store = {
    legacyDetailMaterial: signal(new LegacyMaterialSnapshot({ id: 3, name: 'Historical material', code: 'OLD-3', supplier: 'Supplier', batchNumber: 'OLD-LOT', expirationDate: '2026-09-01', quantityInStock: 0, minimumStock: 4, unit: 'kg' })),
    legacyDetailConsumptions: signal([
      new MaterialConsumption({ id: 1, batchId: 8, quantityUsed: 4, unit: 'kg', usageDate: '2026-09-01', stockBefore: 4, stockAfter: 0 }),
      new MaterialConsumption({ id: 2, batchId: 8, quantityUsed: 2, unit: 'kg', usageDate: '2026-08-01' }),
    ]),
    legacyDetailLoading: signal(false), legacyDetailError: signal(null),
    legacyDetailHasUnrecordedStock: () => true, legacyDetailBatches: signal([new ConsumingBatch({ id: 8, batchNumber: 'PB-8' })]),
    loadLegacyDetail: vi.fn(), clearLegacyDetail: vi.fn(),
  };
  beforeEach(() => {
    params.next(convertToParamMap({ id: '3' })); vi.clearAllMocks();
    TestBed.configureTestingModule({ imports: [LegacyMaterialDetail], providers: [
      provideRouter([]), provideTranslateService(),
      { provide: ActivatedRoute, useValue: { paramMap: params } },
      { provide: InventoryStore, useValue: store },
    ] });
  });
  it('renders exhausted stock, recorded and unrecorded balances, and production batch links', () => {
    const fixture = TestBed.createComponent(LegacyMaterialDetail); fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('Historical material');
    expect(element.querySelector('.stock-total strong')?.textContent).toContain('0 kg');
    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelectorAll('td')[4].textContent).toBe('0 kg');
    expect(rows[1].textContent).toContain('material-history.unrecorded');
    expect(rows[0].querySelector('a')?.getAttribute('href')).toBe('/batches/8');
    expect(rows[0].querySelector('a')?.textContent).toBe('PB-8');
  });
  it('reloads on identifier changes and clears the preserved detail on navigation away', () => {
    const fixture = TestBed.createComponent(LegacyMaterialDetail); fixture.detectChanges();
    expect(store.loadLegacyDetail).toHaveBeenCalledWith(3);
    params.next(convertToParamMap({ id: '4' }));
    expect(store.loadLegacyDetail).toHaveBeenLastCalledWith(4);
    fixture.destroy();
    expect(store.clearLegacyDetail).toHaveBeenCalledOnce();
  });
});
