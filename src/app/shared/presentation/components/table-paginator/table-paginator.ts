import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Signal,
  WritableSignal,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

/** Rows of a page offered by every table; the first one is the size a table opens with. */
export const TABLE_PAGE_SIZES = [10, 25, 50];

/** Page of a table: the rows it shows and where it is. */
export interface TablePage<T> {
  /** Rows of the page shown. */
  readonly rows: Signal<readonly T[]>;
  /** Number of rows of the whole table. */
  readonly length: Signal<number>;
  /** Index of the page shown. */
  readonly pageIndex: WritableSignal<number>;
  /** Rows of a page. */
  readonly pageSize: WritableSignal<number>;
}

/**
 * Splits the rows of a table into pages of ten, or of the size the person chooses.
 *
 * @remarks
 * When the number of rows or the page size changes (a filter, a new size) the table goes back to its first
 * page; a refresh that keeps the same rows keeps the page the person is on.
 *
 * @example
 * ```typescript
 * protected readonly page = paginate(() => this.store.staffList());
 * ```
 *
 * @param source - The rows of the whole table, already filtered and sorted
 * @returns The page to show and the state of the paginator
 */
export function paginate<T>(source: () => readonly T[]): TablePage<T> {
  const length = computed(() => source().length);
  const pageSize = signal(TABLE_PAGE_SIZES[0]);
  const pageIndex = linkedSignal({
    source: () => [length(), pageSize()] as const,
    computation: () => 0,
  });
  const rows = computed(() => {
    const start = pageIndex() * pageSize();
    return source().slice(start, start + pageSize());
  });
  return { rows, length, pageIndex, pageSize };
}

/**
 * Texts of the paginator in the language of the application.
 *
 * @returns Paginator texts that update when the language changes
 */
export function tablePaginatorIntl(): MatPaginatorIntl {
  const translate = inject(TranslateService);
  const intl = new MatPaginatorIntl();
  translate
    .stream('common.paginator')
    .pipe(takeUntilDestroyed(inject(DestroyRef)))
    .subscribe((texts: Record<string, string> | string) => {
      if (typeof texts !== 'object' || texts === null) return;
      intl.itemsPerPageLabel = texts['per-page'];
      intl.firstPageLabel = texts['first'];
      intl.previousPageLabel = texts['previous'];
      intl.nextPageLabel = texts['next'];
      intl.lastPageLabel = texts['last'];
      intl.changes.next();
    });
  intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return translate.instant('common.paginator.empty');
    const start = page * pageSize + 1;
    const end = Math.min(length, (page + 1) * pageSize);
    return translate.instant('common.paginator.range', { start, end, length });
  };
  return intl;
}

/**
 * Paginator of a table: ten rows per page, or the size the person chooses.
 *
 * @remarks
 * It only appears when the table has more rows than the smallest page, so a short table stays clean.
 *
 * @example
 * ```html
 * <div class="table-card">
 *   <table class="data-table">…@for (row of page.rows(); track row.id)…</table>
 *   <app-table-paginator [page]="page" />
 * </div>
 * ```
 */
@Component({
  selector: 'app-table-paginator',
  standalone: true,
  imports: [MatPaginatorModule],
  providers: [{ provide: MatPaginatorIntl, useFactory: tablePaginatorIntl }],
  template: `
    @if (page().length() > pageSizes[0]) {
      <mat-paginator
        [length]="page().length()"
        [pageIndex]="page().pageIndex()"
        [pageSize]="page().pageSize()"
        [pageSizeOptions]="pageSizes"
        [showFirstLastButtons]="true"
        (page)="change($event)"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }

    mat-paginator {
      border-top: 1px solid var(--qt-border);
      background: var(--qt-surface);
      color: var(--qt-text-muted);
    }

    @media (max-width: 760px) {
      mat-paginator {
        border: 1px solid var(--qt-border);
        border-radius: var(--qt-radius-medium);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePaginator {
  /** Page of the table, made with `paginate`. */
  readonly page = input.required<TablePage<unknown>>();

  /** Page sizes offered. */
  protected readonly pageSizes = TABLE_PAGE_SIZES;

  /**
   * Keeps the page and the page size chosen.
   *
   * @param event - The paginator event
   */
  protected change(event: PageEvent): void {
    this.page().pageSize.set(event.pageSize);
    this.page().pageIndex.set(event.pageIndex);
  }
}
