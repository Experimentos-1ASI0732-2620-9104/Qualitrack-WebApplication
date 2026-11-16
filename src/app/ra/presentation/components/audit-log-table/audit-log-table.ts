import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {AUDIT_LOG_COLUMNS, AuditLogRow} from '../../utils/audit-log-viewer.utils';
import {NgClass} from '@angular/common';
import {EmptyState} from '../../../../shared/presentation/components/empty-state/empty-state';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Pure presentation table for the Audit Log Viewer.
 *
 * @remarks
 * This component has no knowledge of the global store or the filters.
 * It strictly receives an array of pre-formatted `AuditLogRow` objects
 * and a `loading` state. It delegates the empty state to the shared `EmptyState`.
 */
@Component({
  selector: 'app-audit-log-table',
  standalone: true,
  imports: [TablePaginator, TranslatePipe, MatTableModule, MatIconModule, MatProgressSpinnerModule, NgClass, EmptyState],
  templateUrl: './audit-log-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './audit-log-table.css',
})
export class AuditLogTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly rowPage = paginate(() => this.rows());

  /** Formatted rows provided by the parent component. */
  readonly rows = input.required<readonly AuditLogRow[]>();

  /** Indicates if the data is currently being fetched. */
  readonly loading = input(false);

  /** Column identifiers displayed in the data table. */
  protected readonly columns = AUDIT_LOG_COLUMNS;
}
