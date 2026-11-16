import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StatusChip } from '../../../../shared/presentation/components/status-chip/status-chip';
import { BatchStatus } from '../../../domain/model/batch.entity';
import { BATCH_STATUS_CHIPS, UNKNOWN_BATCH_STATUS_CHIP } from '../../batch-chips';

/**
 * Status of a batch as a chip with its icon and tone.
 *
 * @example
 * ```html
 * <app-batch-status-chip [status]="batch.status" />
 * ```
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-status-chip',
  standalone: true,
  imports: [StatusChip],
  template: `<app-status-chip
    [tone]="chip().tone"
    [icon]="chip().icon"
    [labelKey]="chip().labelKey"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchStatusChip {
  /** Status of the batch. */
  readonly status = input.required<BatchStatus>();

  /** Tone, icon and label of the status. */
  protected readonly chip = computed(
    () => BATCH_STATUS_CHIPS[this.status()] ?? UNKNOWN_BATCH_STATUS_CHIP,
  );
}
