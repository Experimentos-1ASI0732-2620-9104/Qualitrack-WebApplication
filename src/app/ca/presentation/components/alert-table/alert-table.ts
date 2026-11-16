import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { StatusChip } from '../../../../shared/presentation/components/status-chip/status-chip';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { ElapsedTimePipe } from '../../../../shared/presentation/pipes/elapsed-time.pipe';
import { CaStore } from '../../../application/ca.store';
import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { ALERT_SEVERITY_CHIPS, ALERT_STATUS_CHIPS } from '../../alert-chips';
import { alertVariableName } from '../../alert-variable';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Table of the alert history (TS74): when and where each alert started, how serious it was, where it is in its life
 * cycle, how long it took to attend and to resolve, who resolved it and with which corrective action.
 *
 * @remarks
 * It only shows the alerts it receives; the view that uses it loads and filters them through the {@link CaStore}.
 * "View" opens the detail of an alert over the table, keeping the filter of the address.
 */
@Component({
  selector: 'app-alert-table',
  standalone: true,
  imports: [
    TablePaginator, DateTimePipe,
    DecimalPipe,
    ElapsedTimePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StatusChip,
    TranslatePipe,
  ],
  templateUrl: './alert-table.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-table.css',
})
export class AlertTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly alertPage = paginate(() => this.alerts());

  /** Alerts to show, one per row. */
  readonly alerts = input.required<DeviationAlert[]>();

  /** Current moment, to tell how long an open alert has been open. */
  readonly now = input.required<Date>();

  /** Store used to name the device of each alert and the person who resolved it. */
  protected readonly store = inject(CaStore);
  private readonly translate = inject(TranslateService);

  protected readonly severityChips = ALERT_SEVERITY_CHIPS;
  protected readonly statusChips = ALERT_STATUS_CHIPS;

  /**
   * Translated name of the variable that deviated.
   *
   * @param alert - The alert
   * @returns The name of the variable
   */
  protected variableOf(alert: DeviationAlert): string {
    return alertVariableName(this.translate, alert.parameterName);
  }

  /**
   * Name of the person who resolved an alert.
   *
   * @param alert - The alert
   * @returns The name, the user number while the name is unknown, or null when nobody resolved it
   */
  protected resolvedByOf(alert: DeviationAlert): string | null {
    if (alert.resolvedBy === null) return null;
    return (
      this.store.personName(alert.resolvedBy) ??
      this.translate.instant('ca-alerts.detail.user', { id: alert.resolvedBy })
    );
  }

  /**
   * Initials of a name, for the avatar next to it.
   *
   * @param name - The name
   * @returns Up to two capital letters
   */
  protected initialsOf(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  }
}
