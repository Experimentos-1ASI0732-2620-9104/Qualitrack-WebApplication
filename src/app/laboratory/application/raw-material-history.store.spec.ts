import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RawMaterialHistoryStore } from './raw-material-history.store';
import { LaboratoryApi } from '../infrastructure/laboratory-api';
import { BatchApi } from '../../batch/infrastructure/batch-api';

describe('Raw material consumption history', () => {
  it('keeps legacy balances unknown and displays real batch numbers', () => {
    TestBed.configureTestingModule({ providers: [RawMaterialHistoryStore,
      { provide: LaboratoryApi, useValue: { getRawMaterials: () => of([{ id: 1, quantityInStock: 50 }]) } },
      { provide: BatchApi, useValue: {
        getMaterialHistory: () => of([{ id: 3, batchId: 4, stockAfter: null }]),
        getBatches: () => of([{ id: 4, batchNumber: 'LOT-2026-001' }]),
      } },
    ] });
    const store = TestBed.inject(RawMaterialHistoryStore);
    store.load(2, 1);
    expect(store.material()?.quantityInStock).toBe(50);
    expect(store.hasLegacy()).toBe(true);
    expect(store.batchLabel(4)).toBe('LOT-2026-001');
  });
  it('shows a failed history request as an error, not an empty movement list', () => {
    TestBed.configureTestingModule({ providers: [RawMaterialHistoryStore,
      { provide: LaboratoryApi, useValue: { getRawMaterials: () => of([{ id: 1 }]) } },
      { provide: BatchApi, useValue: { getMaterialHistory: () => throwError(() => new Error('Unavailable')), getBatches: () => of([]) } },
    ] });
    const store = TestBed.inject(RawMaterialHistoryStore);
    store.load(2, 1);
    expect(store.error()).toBe('material-history.load-error');
    expect(store.loading()).toBe(false);
    expect(store.material()).toBeNull();
  });
});
