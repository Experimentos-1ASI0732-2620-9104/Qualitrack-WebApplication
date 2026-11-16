import { Component, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {AuditLogQuery, buildAuditLogQuery, emptyAuditLogFilters, isInvalidId,} from '../../utils/audit-log-viewer.utils';
import {calendarDate, PERIOD_ERROR_KEYS, periodError, PeriodError,} from '../../utils/report-period';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { MIN_DATE } from '../../../../shared/presentation/validators/date.validators';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';

/**
 * Filter panel for the Audit Log Viewer.
 *
 * @remarks
 * This component encapsulates the filter form state, including the validation
 * of positive integer IDs and the date range period.
 *
 * It uses pure utility functions to emit a clean query payload to the parent
 * component only when the form is completely valid. It forces the user to select
 * dates from the calendar by blocking keyboard input on the datepicker.
 */
@Component({
  imports: [
    MatIcon,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButton,
    MatInput,
    TranslatePipe,
  ],
  selector: 'app-audit-log-filters',
  styleUrl: './audit-log-filters.css',
  templateUrl: './audit-log-filters.html',
})
export class AuditLogFilters {
  /** Translation service used to resolve error message keys. */
  private readonly translate = inject(TranslateService);

  /** Indicates if the parent store is currently loading data. */
  readonly loading = input(false);

  /** Emits the constructed query payload (or undefined if empty). */
  readonly search = output<AuditLogQuery | undefined>();

  /** Emits an event when the user clicks the clear button. */
  readonly clear = output<void>();

  /** Internal state of the filter form. */
  protected filters = emptyAuditLogFilters();

  /** Earliest day the date picker accepts. */
  protected readonly minDate = calendarDate(MIN_DATE);

  /** Latest day the date picker accepts: today in Lima. */
  protected get maxDate(): Date {
    return calendarDate(todayInLima());
  }

  /** Returns the first problem found in the date period, if any. */
  protected get periodProblem(): PeriodError | null {
    return periodError(this.filters.dateFrom, this.filters.dateTo);
  }

  /**
   * Retrieves the translation key for a specific date period error.
   *
   * @param error - The problem found in the period
   * @returns The translation key for the error message
   */
  protected periodMessage(error: PeriodError): string {
    return PERIOD_ERROR_KEYS[error];
  }

  /**
   * Checks if an identifier typed in the filter is invalid.
   *
   * @param value - The identifier to validate
   * @returns True if the value is not a positive whole number
   */
  protected isInvalidId(value: number | null): boolean {
    return isInvalidId(value);
  }

  /** Indicates if the form has no validation errors and can be submitted. */
  protected get filtersValid(): boolean {
    return (
      !this.periodProblem &&
      !isInvalidId(this.filters.equipmentId) &&
      !isInvalidId(this.filters.batchId)
    );
  }

  /** Dispatches the search event with the constructed query payload. */
  protected onSearch(): void {
    if (!this.filtersValid) return;
    this.search.emit(buildAuditLogQuery(this.filters));
  }

  /** Resets the form to its default empty state and dispatches the clear event. */
  protected onClear(): void {
    this.filters = emptyAuditLogFilters();
    this.clear.emit();
  }
}
