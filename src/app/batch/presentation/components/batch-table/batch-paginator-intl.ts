import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

/**
 * Texts of the paginator of the batch list in the language of the application.
 *
 * @remarks
 * Provided by the table component, so the texts follow the language the person chooses.
 *
 * @example
 * ```typescript
 * providers: [{ provide: MatPaginatorIntl, useFactory: batchPaginatorIntl }]
 * ```
 *
 * @returns Paginator texts that update when the language changes
 */
export function batchPaginatorIntl(): MatPaginatorIntl {
  const translate = inject(TranslateService);
  const intl = new MatPaginatorIntl();
  translate
    .stream('batches.table.paginator')
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
    if (length === 0) return translate.instant('batches.table.paginator.empty');
    const start = page * pageSize + 1;
    const end = Math.min(length, (page + 1) * pageSize);
    return translate.instant('batches.table.paginator.range', { start, end, length });
  };
  return intl;
}
