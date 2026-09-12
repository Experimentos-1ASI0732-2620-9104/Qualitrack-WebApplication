import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RaStore } from '../../../application/ra.store';
import { AuditAction } from '../../../domain/model/audit-log-entry.entity';

/**
 * Component responsible for displaying and filtering the system audit log.
 *
 * @remarks
 * In the presentation layer, this component provides the user interface for
 * querying historical system actions for compliance and traceability purposes.
 * It interacts with {@link RaStore} to fetch filtered records based on equipment,
 * production batches, or specific timeframes.
 */
@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './audit-log-viewer.html',
  styleUrl: './audit-log-viewer.css',
})
export class AuditLogViewerComponent implements OnInit {
  /**
   * The application store managing the state for the Reporting and Analysis bounded context.
   */
  protected readonly store = inject(RaStore);

  /**
   * Column identifiers displayed in the audit log data table.
   */
  protected readonly displayedColumns = ['timestamp', 'action', 'entity', 'performedBy'];
  /**
   * Current filter state for querying audit logs.
   *
   * @remarks
   * Maintains the template-driven filter form state. Entity identifiers are numeric
   * to stay aligned with the backend API contract.
   */
  protected filters: {
    equipmentId: number | null;
    batchId: number | null;
    dateFrom: Date | null;
    dateTo: Date | null;
  } = {
    equipmentId: null,
    batchId: null,
    dateFrom: null,
    dateTo: null,
  };

  /**
   * Lifecycle hook that initializes the component by loading the default audit log collection.
   */
  ngOnInit(): void {
    this.loadLogs();
  }

  /**
   * Builds the audit log query from the current filter state and dispatches it to the store.
   *
   * @remarks
   * Empty filters are omitted from the request. When no filters are present,
   * the store receives `undefined`, allowing the backend to return its default log collection.
   */
  protected loadLogs(): void {
    const query: {
      equipmentId?: number;
      batchId?: number;
      dateFrom?: string;
      dateTo?: string;
    } = {};

    if (this.filters.equipmentId !== null) {
      query.equipmentId = Number(this.filters.equipmentId);
    }

    if (this.filters.batchId !== null) {
      query.batchId = Number(this.filters.batchId);
    }

    if (this.filters.dateFrom) {
      query.dateFrom = this.filters.dateFrom.toISOString();
    }

    if (this.filters.dateTo) {
      query.dateTo = this.filters.dateTo.toISOString();
    }

    const hasFilters = Object.keys(query).length > 0;
    this.store.loadAuditLog(hasFilters ? query : undefined);
  }

  /**
   * Resets the filter form to its default empty state and reloads the audit log.
   */
  protected clearFilters(): void {
    this.filters = {
      equipmentId: null,
      batchId: null,
      dateFrom: null,
      dateTo: null,
    };

    this.loadLogs();
  }

  /**
   * Resolves a CSS class for semantic coloring based on the audit action.
   *
   * @param action - The audit action recorded in the log entry
   * @returns The CSS class to apply to the action badge
   */
  protected getActionBadgeClass(action: AuditAction): string {
    switch (action) {
      case 'CREATE':
      case 'REGISTER':
        return 'badge-create';

      case 'UPDATE':
        return 'badge-update';

      case 'DELETE':
        return 'badge-delete';

      case 'RELEASE':
      case 'ACKNOWLEDGE':
      case 'RESOLVE':
      case 'GENERATE':
      case 'EXPORT':
        return 'badge-success';

      case 'REJECT':
        return 'badge-danger';

      case 'UNKNOWN':
      default:
        return 'badge-default';
    }
  }
}
