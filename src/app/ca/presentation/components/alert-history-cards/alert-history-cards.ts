import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { ElapsedTimePipe } from '../../../../shared/presentation/pipes/elapsed-time.pipe';
import { summarizeAlertHistory } from '../../../domain/model/alert-history-metrics';
import { AlertSeverity, DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { ALERT_SEVERITY_CHIPS } from '../../alert-chips';

/**
 * Metrics of the alert history: how many alerts there were, how many were resolved, and how long it took on average
 * to attend and to resolve them.
 *
 * @remarks
 * The cards only inform; they do not filter. They count the alerts they receive, so they follow the filter of the
 * history. The goals of the mockup (≤ 4 h, ≤ 2 d) are left out until the team agrees on them.
 */
@Component({
  selector: 'app-alert-history-cards',
  standalone: true,
  imports: [ElapsedTimePipe, MatIconModule, TranslatePipe],
  templateUrl: './alert-history-cards.html',
  styleUrl: './alert-history-cards.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertHistoryCards {
  /** Alerts that pass the filter of the history. */
  readonly alerts = input.required<readonly DeviationAlert[]>();

  /** Counts and average times of the alerts. */
  protected readonly summary = computed(() => summarizeAlertHistory(this.alerts()));

  /** Severities in the order the chips show them. */
  protected readonly severities: readonly AlertSeverity[] = ['CRITICAL', 'WARNING', 'LOW'];

  /** Chip of each severity, for its name. */
  protected readonly severityChips = ALERT_SEVERITY_CHIPS;

  /** Moment zero, so an average time can be written with the `elapsedTime` pipe. */
  protected readonly start = new Date(0);

  /**
   * Moment that lies an amount of time after {@link start}.
   *
   * @param time - The amount of time, in milliseconds
   * @returns The moment
   */
  protected after(time: number): Date {
    return new Date(time);
  }
}
