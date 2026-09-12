import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { BatchStore } from './batch.store';
import { BatchApi } from '../infrastructure/batch-api';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';

describe('Batch inventory consumption', () => {
  const command = { rawMaterialId: 2, quantityUsed: 50, unit: 'kg' };
  it('sends the stock unit, waits for confirmation, and prevents a double submission', async () => {
    const response = new Subject<RawMaterialUsage>();
    const link = vi.fn(() => response);
    TestBed.configureTestingModule({ providers: [{ provide: BatchApi, useValue: { linkRawMaterial: link } }] });
    const store = TestBed.inject(BatchStore);
    const pending = store.linkMaterial(7, command);
    expect(store.isLinking()).toBe(true);
    expect(await store.linkMaterial(7, command)).toBe(false);
    expect(link).toHaveBeenCalledExactlyOnceWith(7, command);
    expect(store.currentBatchUsage()).toEqual([]);
    response.next({ id: 1, stockBefore: 100, stockAfter: 50 } as RawMaterialUsage);
    expect(await pending).toBe(true);
    expect(store.isLinking()).toBe(false);
    expect(store.currentBatchUsage()[0].stockAfter).toBe(50);
  });

  it('shows insufficient stock on conflict and does not add a false usage', async () => {
    const link = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 409 })));
    TestBed.configureTestingModule({ providers: [{ provide: BatchApi, useValue: { linkRawMaterial: link } }] });
    const store = TestBed.inject(BatchStore);
    expect(await store.linkMaterial(7, command)).toBe(false);
    expect(store.currentBatchUsage()).toEqual([]);
    expect(store.error()).toBe('batch-usage.errors.stock-changed');
    expect(link).toHaveBeenCalledTimes(1);
  });

  it('preserves validation details from the server', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: BatchApi, useValue: {
      linkRawMaterial: () => throwError(() => new HttpErrorResponse({ status: 400,
        error: { details: 'Consumption unit must match stock unit: kg' } })),
    } }] });
    const store = TestBed.inject(BatchStore);
    expect(await store.linkMaterial(7, command)).toBe(false);
    expect(store.error()).toContain('stock unit: kg');
  });
});
