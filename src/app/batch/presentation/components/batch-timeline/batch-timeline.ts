import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { BatchStore } from '../../../application/batch.store';
import { BatchTraceability } from '../../../domain/model/batch-traceability.entity';
import { personLabel } from '../../batch-people';
import { buildBatchTimeline } from '../../batch-timeline';

/**
 * Timeline of a batch: start, staff and equipment that took part, raw material consumptions, storage and the
 * quality decision, oldest first, with who registered each record.
 *
 * @example
 * ```html
 * <app-batch-timeline [trace]="trace" />
 * ```
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-timeline',
  standalone: true,
  imports: [DateOnlyPipe, DateTimePipe, MatIconModule, TranslatePipe],
  templateUrl: './batch-timeline.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-timeline.css',
})
export class BatchTimeline {
  private readonly store = inject(BatchStore);
  private readonly translate = inject(TranslateService);

  /** Traceability of the batch. */
  readonly trace = input.required<BatchTraceability>();

  /** Records of the timeline, oldest first. */
  protected readonly entries = computed(() => buildBatchTimeline(this.trace()));

  /**
   * Name of the person who registered a record.
   *
   * @param userId - The user account that registered it
   * @returns The full name, "you" or the user id
   */
  protected actor(userId: number): string {
    return personLabel(this.store, this.translate, userId);
  }
}
