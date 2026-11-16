import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { ElapsedTimePipe } from '../../../../shared/presentation/pipes/elapsed-time.pipe';
import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';

/** What the timeline tells about the alert at one moment. */
interface TimelineEvent {
  kind: 'detected' | 'last-deviation' | 'attending' | 'normalized' | 'resolved';
  at: string;
  icon: string;
}

/**
 * Tells what happened to an alert, in order, and what is still missing.
 *
 * @remarks
 * Events are ordered by when they happened, because a condition can return to normal before anybody attends the alert.
 */
@Component({
  selector: 'app-alert-timeline',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, TranslatePipe, DateTimePipe, ElapsedTimePipe],
  templateUrl: './alert-timeline.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-timeline.css',
})
export class AlertTimeline {
  /** Alert to tell about. */
  readonly alert = input.required<DeviationAlert>();

  /** Name of the device that detected the deviation. */
  readonly deviceName = input.required<string>();

  /** Name of the person attending the alert. */
  readonly attendedBy = input<string | null>(null);

  /** Name of the person who resolved the alert. */
  readonly resolvedBy = input<string | null>(null);

  /** What happened, oldest first. */
  protected readonly events = computed(() => {
    const alert = this.alert();
    const events: TimelineEvent[] = [{ kind: 'detected', at: alert.timestamp, icon: 'sensors' }];
    if (alert.deviationCount > 1 && alert.lastDetectedAt) {
      events.push({ kind: 'last-deviation', at: alert.lastDetectedAt, icon: 'replay' });
    }
    if (alert.acknowledgedAt) {
      events.push({ kind: 'attending', at: alert.acknowledgedAt, icon: 'pan_tool' });
    }
    if (alert.normalizedAt) {
      events.push({ kind: 'normalized', at: alert.normalizedAt, icon: 'check' });
    }
    if (alert.resolvedAt) {
      events.push({ kind: 'resolved', at: alert.resolvedAt, icon: 'task_alt' });
    }
    return events.sort((first, second) => Date.parse(first.at) - Date.parse(second.at));
  });
}
