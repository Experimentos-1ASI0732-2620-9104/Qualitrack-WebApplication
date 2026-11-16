import { Sort } from '@angular/material/sort';
import { Batch, BatchStatus } from '../domain/model/batch.entity';
import { BATCH_STATUSES } from './batch-chips';

/**
 * Criteria of the batch list.
 */
export interface BatchFilter {
  /** Text contained in the batch number or the product name. */
  search: string;
  /** Status of the batch; empty means every status. */
  status: BatchStatus | '';
  /** Environment of the batch; null means every environment. */
  environmentId: number | null;
  /** First start day included, `yyyy-MM-dd`; null for no lower bound. */
  from: string | null;
  /** Last start day included, `yyyy-MM-dd`; null for no upper bound. */
  to: string | null;
}

/**
 * Criteria that show every batch.
 */
export const EMPTY_BATCH_FILTER: Readonly<BatchFilter> = {
  search: '',
  status: '',
  environmentId: null,
  from: null,
  to: null,
};

/**
 * Number of batches of each status, plus the products they belong to.
 */
export interface BatchCounts extends Record<BatchStatus, number> {
  total: number;
  products: number;
}

/**
 * Whether any criterion hides batches.
 *
 * @param filter - The criteria of the list
 * @returns True when the list does not show every batch
 */
export function isBatchFilterApplied(filter: BatchFilter): boolean {
  return (
    filter.search.trim() !== '' ||
    filter.status !== '' ||
    filter.environmentId !== null ||
    filter.from !== null ||
    filter.to !== null
  );
}

/**
 * Whether a batch meets the criteria.
 *
 * @param batch - The batch
 * @param filter - The criteria of the list
 * @returns True when the batch is shown
 */
export function matchesBatchFilter(batch: Batch, filter: BatchFilter): boolean {
  const term = filter.search.trim().toLowerCase();
  const day = (batch.startDate ?? '').slice(0, 10);
  return (
    (filter.status === '' || batch.status === filter.status) &&
    (filter.environmentId === null || batch.environmentId === filter.environmentId) &&
    (filter.from === null || day >= filter.from) &&
    (filter.to === null || day <= filter.to) &&
    `${batch.batchNumber} ${batch.productName}`.toLowerCase().includes(term)
  );
}

/**
 * Batches that meet the criteria, in the same order.
 *
 * @param batches - The batches of the laboratory
 * @param filter - The criteria of the list
 * @returns The batches that are shown
 */
export function filterBatches(batches: readonly Batch[], filter: BatchFilter): Batch[] {
  return batches.filter((batch) => matchesBatchFilter(batch, filter));
}

/**
 * Counts the batches of each status and the products they belong to.
 *
 * @param batches - The batches to count
 * @returns The figures of the indicators
 */
export function countBatches(batches: readonly Batch[]): BatchCounts {
  const counts: BatchCounts = {
    total: batches.length,
    products: new Set(batches.map((batch) => batch.productId)).size,
    PENDING: 0,
    IN_PROGRESS: 0,
    RELEASED: 0,
    REJECTED: 0,
  };
  for (const batch of batches) if (batch.status in counts) counts[batch.status]++;
  return counts;
}

/**
 * Share of a quality decision among the closed batches.
 *
 * @param counts - The figures of the indicators
 * @param decision - `RELEASED` or `REJECTED`
 * @returns The rounded percentage, or null when no batch is closed
 */
export function decisionRate(
  counts: BatchCounts,
  decision: 'RELEASED' | 'REJECTED',
): number | null {
  const closed = counts.RELEASED + counts.REJECTED;
  return closed === 0 ? null : Math.round((counts[decision] * 100) / closed);
}

/**
 * Columns of the batch list that can be sorted.
 */
export type BatchSortColumn = 'batchNumber' | 'product' | 'quantity' | 'startDate' | 'status';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const comparators: Record<BatchSortColumn, (a: Batch, b: Batch) => number> = {
  batchNumber: (a, b) => collator.compare(a.batchNumber, b.batchNumber),
  product: (a, b) => collator.compare(a.productName ?? '', b.productName ?? ''),
  quantity: (a, b) => a.quantity - b.quantity,
  startDate: (a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''),
  status: (a, b) => BATCH_STATUSES.indexOf(a.status) - BATCH_STATUSES.indexOf(b.status),
};

/**
 * Sorts the batches by a column of the list.
 *
 * @remarks
 * Without an active column or direction the batches keep their order (newest first). Ties keep their order too.
 *
 * @param batches - The batches to sort
 * @param sort - The column and direction chosen in the table
 * @returns A new sorted array
 */
export function sortBatches(batches: readonly Batch[], sort: Sort): Batch[] {
  const compare = comparators[sort.active as BatchSortColumn];
  if (!compare || sort.direction === '') return [...batches];
  const sign = sort.direction === 'asc' ? 1 : -1;
  return [...batches].sort((a, b) => sign * compare(a, b));
}
