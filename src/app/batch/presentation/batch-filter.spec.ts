import { Batch, BatchStatus } from '../domain/model/batch.entity';
import {
  EMPTY_BATCH_FILTER,
  countBatches,
  decisionRate,
  filterBatches,
  isBatchFilterApplied,
  sortBatches,
} from './batch-filter';

function batch(
  id: number,
  status: BatchStatus,
  overrides: Partial<ConstructorParameters<typeof Batch>[0]> = {},
): Batch {
  return new Batch({
    id,
    labId: 42,
    environmentId: 1,
    productId: 5,
    productName: 'Ibuprofen 400 mg',
    batchNumber: `LOT-${id}`,
    quantity: id * 100,
    unit: 'units',
    status,
    startDate: '2026-10-01',
    ...overrides,
  });
}

describe('batch filter', () => {
  const batches = [
    batch(3, 'PENDING', { startDate: '2026-10-20' }),
    batch(2, 'RELEASED', {
      environmentId: 2,
      productId: 6,
      productName: 'Paracetamol 500 mg',
      startDate: '2026-09-15',
    }),
    batch(1, 'REJECTED', { startDate: '2026-08-30' }),
    batch(10, 'IN_PROGRESS', { environmentId: null, startDate: '2026-10-05' }),
  ];

  it('shows every batch without criteria', () => {
    expect(isBatchFilterApplied(EMPTY_BATCH_FILTER)).toBe(false);
    expect(filterBatches(batches, EMPTY_BATCH_FILTER)).toEqual(batches);
  });

  it('combines the text, status, environment and start days', () => {
    expect(
      filterBatches(batches, { ...EMPTY_BATCH_FILTER, search: 'paracetamol' }).map((b) => b.id),
    ).toEqual([2]);
    expect(
      filterBatches(batches, { ...EMPTY_BATCH_FILTER, search: 'lot-1' }).map((b) => b.id),
    ).toEqual([1, 10]);
    expect(
      filterBatches(batches, { ...EMPTY_BATCH_FILTER, status: 'PENDING' }).map((b) => b.id),
    ).toEqual([3]);
    expect(
      filterBatches(batches, { ...EMPTY_BATCH_FILTER, environmentId: 1 }).map((b) => b.id),
    ).toEqual([3, 1]);
    expect(
      filterBatches(batches, { ...EMPTY_BATCH_FILTER, from: '2026-09-01', to: '2026-10-05' }).map(
        (b) => b.id,
      ),
    ).toEqual([2, 10]);
    expect(isBatchFilterApplied({ ...EMPTY_BATCH_FILTER, to: '2026-10-05' })).toBe(true);
  });

  it('counts each status, the products and the share of each decision among closed batches', () => {
    const counts = countBatches([...batches, batch(4, 'RELEASED'), batch(5, 'RELEASED')]);

    expect(counts).toEqual({
      total: 6,
      products: 2,
      PENDING: 1,
      IN_PROGRESS: 1,
      RELEASED: 3,
      REJECTED: 1,
    });
    expect(decisionRate(counts, 'RELEASED')).toBe(75);
    expect(decisionRate(counts, 'REJECTED')).toBe(25);
    expect(decisionRate(countBatches([batch(6, 'PENDING')]), 'RELEASED')).toBeNull();
  });

  it('sorts by a column and keeps the order without one', () => {
    const ids = (sort: Parameters<typeof sortBatches>[1]) =>
      sortBatches(batches, sort).map((b) => b.id);

    expect(ids({ active: '', direction: '' })).toEqual([3, 2, 1, 10]);
    expect(ids({ active: 'batchNumber', direction: 'asc' })).toEqual([1, 2, 3, 10]);
    expect(ids({ active: 'quantity', direction: 'desc' })).toEqual([10, 3, 2, 1]);
    expect(ids({ active: 'startDate', direction: 'asc' })).toEqual([1, 2, 10, 3]);
    expect(ids({ active: 'status', direction: 'asc' })).toEqual([3, 10, 2, 1]);
    expect(ids({ active: 'product', direction: 'desc' })).toEqual([2, 3, 1, 10]);
  });
});
