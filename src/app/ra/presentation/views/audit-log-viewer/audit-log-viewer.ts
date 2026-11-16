import {Component, OnInit, inject, ChangeDetectionStrategy, computed, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RaStore } from '../../../application/ra.store';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { MIN_DATE } from '../../../../shared/presentation/validators/date.validators';
import {
  calendarDate,
  PERIOD_ERROR_KEYS,
  PeriodError,
  periodError,
} from '../../utils/report-period';
import { AuditAction } from '../../../domain/model/audit-log-entry.entity';
import {AuditLogTable} from '../../components/audit-log-table/audit-log-table';
import {AuditLogQuery, toAuditLogRows} from '../../utils/audit-log-viewer.utils';
import {toSignal} from '@angular/core/rxjs-interop';
import {ErrorBanner} from '../../../../shared/presentation/components/error-banner/error-banner';
import {AuditLogFilters} from '../../components/audit-log-filters/audit-log-filters';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { REPORTS_TABS } from '../../reports-tabs';

/**
 * Orchestrator component for the Audit Log Viewer.
 *
 * @remarks
 * This component connects the global `RaStore` with its two sub-components:
 * `AuditLogFilters` and `AuditLogTable`. It contains no complex logic or validation,
 * acting only as a bridge that listens to child events and formats the store data.
 */
@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [
    PageHeader,
    ListToolbar,
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    AuditLogTable,
    ErrorBanner,
    AuditLogFilters,
  ],
  templateUrl: './audit-log-viewer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './audit-log-viewer.css',
})
export class AuditLogViewerComponent implements OnInit {
  /** Operations of the reports module. */
  protected readonly tabs = REPORTS_TABS;

  /** Query of the last search, read again by the refresh. */
  protected readonly lastQuery = signal<AuditLogQuery | undefined>(undefined);

  /** How many filters narrow the log. */
  protected readonly activeFilters = computed(() => Object.keys(this.lastQuery() ?? {}).length);

  /**
   * The application store managing the state for the Reporting and Analysis bounded context.
   */
  protected readonly store = inject(RaStore);
  private readonly translate = inject(TranslateService);

  /** Se re-evalúa cuando cambia el idioma, para reformatear las fechas. */
  private readonly language = toSignal(this.translate.onLangChange, { initialValue: null });

  /**
   * Column identifiers displayed in the audit log data table.
   */
  protected readonly displayedColumns = ['timestamp', 'action', 'entity', 'performedBy'];

  /** Formatted rows ready for the table, recalculated if the language changes. */
  protected readonly rows = computed(() => {
    this.language();
    return toAuditLogRows(this.store.auditLogs(), this.translate.currentLang() || 'en');
  });

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
   * Earliest day the date range picker accepts.
   */
  protected readonly minDate = calendarDate(MIN_DATE);

  /**
   * Latest day the date range picker accepts: today in Lima.
   *
   * @returns The Date of today at local midnight.
   */
  protected get maxDate(): Date {
    return calendarDate(todayInLima());
  }

  /**
   * Problem with the dates of the filter, if any.
   *
   * @returns The first problem found, or null.
   */
  protected get periodProblem(): PeriodError | null {
    return periodError(this.filters.dateFrom, this.filters.dateTo);
  }

  /**
   * Translation key of the message for a problem with the dates.
   *
   * @param error - The problem found
   * @returns The translation key.
   */
  protected periodMessage(error: PeriodError): string {
    return PERIOD_ERROR_KEYS[error];
  }

  /**
   * Whether an entity identifier typed in the filter is not a positive whole number.
   *
   * @param value - The typed identifier; null or empty when the filter is not used
   * @returns True if the value is filled in and is not a positive whole number.
   */
  protected isInvalidId(value: number | null): boolean {
    if (value === null || (value as unknown) === '') return false;
    return !Number.isInteger(Number(value)) || Number(value) < 1;
  }

  /**
   * Whether the filters can be sent: valid identifiers and a valid period.
   *
   * @returns True if nothing in the filters is wrong.
   */
  protected get filtersValid(): boolean {
    return (
      !this.periodProblem &&
      !this.isInvalidId(this.filters.equipmentId) &&
      !this.isInvalidId(this.filters.batchId)
    );
  }

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
    if (!this.filtersValid) return;
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

  /**
   * Handles the search event emitted by the filter component.
   *
   * @param query - The built query payload, or undefined for no filters
   */
  protected onSearch(query: AuditLogQuery | undefined): void {
    this.lastQuery.set(query);
    this.store.loadAuditLog(query);
  }

  /** Handles the clear event emitted by the filter component. */
  protected onClear(): void {
    this.lastQuery.set(undefined);
    this.store.loadAuditLog(undefined);
  }
}
