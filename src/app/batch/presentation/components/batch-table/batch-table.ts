import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { EnvironmentOption } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { Batch } from '../../../domain/model/batch.entity';
import { BatchSortColumn, sortBatches } from '../../batch-filter';
import { BatchStatusChip } from '../batch-status-chip/batch-status-chip';
import { batchPaginatorIntl } from './batch-paginator-intl';

/** Number of batches of a page offered by the paginator. */
const PAGE_SIZES = [10, 25, 50];

/**
 * Table of batches with sorting and pagination.
 *
 * @remarks
 * Clicking a row opens the batch; the batch number is also a link, so the table can be used with the keyboard.
 * Batches registered before environments existed cannot be opened. Without a chosen column the batches keep their
 * order (newest first). Changing the batches, the order or the page size goes back to the first page. A phone shows
 * the batches as cards without headers, so it chooses the column and the direction in two lists above them.
 *
 * @example
 * ```html
 * <app-batch-table [batches]="filtered()" [environments]="store.environments()" />
 * ```
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-table',
  standalone: true,
  imports: [
    BatchStatusChip,
    DateOnlyPipe,
    DecimalPipe,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    RouterLink,
    TranslatePipe,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: batchPaginatorIntl }],
  templateUrl: './batch-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './batch-table.css',
})
export class BatchTable {
  private readonly router = inject(Router);

  /** Batches to show, already filtered. */
  readonly batches = input.required<readonly Batch[]>();

  /** Environments of the laboratory, to show the code of the environment of each batch. */
  readonly environments = input<readonly EnvironmentOption[]>([]);

  /** Columns of the table. */
  protected readonly columns = [
    'batchNumber',
    'product',
    'quantity',
    'startDate',
    'status',
    'open',
  ];

  /** Page sizes offered by the paginator. */
  protected readonly pageSizes = PAGE_SIZES;

  /** Columns offered by the order list of a phone, with the key of their name. */
  protected readonly sortColumns: readonly { id: BatchSortColumn; labelKey: string }[] = [
    { id: 'batchNumber', labelKey: 'batches.fields.number' },
    { id: 'product', labelKey: 'batches.fields.product' },
    { id: 'quantity', labelKey: 'batches.fields.quantity' },
    { id: 'startDate', labelKey: 'batches.fields.date' },
    { id: 'status', labelKey: 'batches.fields.status' },
  ];

  /** Column and direction chosen in the headers or in the order lists; no column keeps the order of the list. */
  protected readonly sort = signal<Sort>({ active: '', direction: '' });

  /** Column that orders the batches, or an empty string while they keep the order of the list. */
  protected readonly sortColumn = computed(() => (this.sort().direction ? this.sort().active : ''));

  /** Number of batches of a page. */
  protected readonly pageSize = signal(PAGE_SIZES[0]);

  /** Page shown; it goes back to the first one when the batches, the order or the page size change. */
  protected readonly pageIndex = linkedSignal({
    source: () => [this.batches(), this.sort(), this.pageSize()] as const,
    computation: () => 0,
  });

  /** Batches in the chosen order. */
  protected readonly sorted = computed(() => sortBatches(this.batches(), this.sort()));

  /** Batches of the page shown. */
  protected readonly page = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  /** Code of each environment by id. */
  private readonly environmentCodes = computed(
    () => new Map(this.environments().map((environment) => [environment.id, environment.code])),
  );

  /**
   * Code of the environment of a batch.
   *
   * @param environmentId - The environment of the batch
   * @returns The code, or null when the batch has no environment or it is unknown
   */
  protected environmentCode(environmentId: number | null): string | null {
    return environmentId === null ? null : (this.environmentCodes().get(environmentId) ?? null);
  }

  /**
   * Orders the batches by a column chosen in the order list of a phone, keeping the direction already chosen.
   *
   * @param column - The column, or an empty string for the order of the list
   */
  protected sortBy(column: BatchSortColumn | ''): void {
    this.sort.set(
      column
        ? { active: column, direction: this.sort().direction || 'asc' }
        : { active: '', direction: '' },
    );
  }

  /**
   * Changes the direction of the order chosen in the order list of a phone.
   *
   * @param direction - Ascending or descending
   */
  protected sortDirection(direction: SortDirection): void {
    this.sort.update((sort) => ({ ...sort, direction }));
  }

  /**
   * Keeps the page and page size chosen in the paginator.
   *
   * @param event - The paginator event
   */
  protected changePage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  /**
   * Opens a batch when its row is clicked; clicks on its link are left to the link.
   *
   * @param batch - The batch of the row
   * @param event - The click
   */
  protected open(batch: Batch, event: MouseEvent): void {
    const link = batch.detailLink;
    if (!link || (event.target as HTMLElement | null)?.closest('a')) return;
    void this.router.navigate(link);
  }
}
