import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { Batch, BatchStatus } from '../../../domain/model/batch.entity';
import { BATCH_STATUS_CHIPS, BATCH_STATUSES } from '../../batch-chips';
import { countBatches } from '../../batch-filter';

/**
 * One indicator of the batch list.
 */
interface BatchKpi {
  status: BatchStatus;
  icon: string;
  labelKey: string;
  value: number;
}

/**
 * Indicators of the batch list: every batch and the batches of each status, with the share of released and
 * rejected batches among the closed ones.
 *
 * @remarks
 * Each indicator also filters the list by its status; choosing the active one again shows every status.
 *
 * @example
 * ```html
 * <app-batch-kpi-cards [batches]="batches()" [selected]="status()" (statusSelected)="status.set($event)" />
 * ```
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-kpi-cards',
  standalone: true,
  imports: [FilterChip, TranslatePipe],
  templateUrl: './batch-kpi-cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './batch-kpi-cards.css',
})
export class BatchKpiCards {
  /** Batches counted by the indicators. */
  readonly batches = input.required<readonly Batch[]>();

  /** Status that filters the list; empty when every status is shown. */
  readonly selected = input<BatchStatus | ''>('');

  /** Emits the status chosen through an indicator; empty to show every status. */
  readonly statusSelected = output<BatchStatus | ''>();

  /** Figures of the indicators. */
  protected readonly counts = computed(() => countBatches(this.batches()));

  /** One indicator per status, in the order of the life cycle. */
  protected readonly kpis = computed<BatchKpi[]>(() => {
    const counts = this.counts();
    return BATCH_STATUSES.map((status) => ({
      status,
      icon: BATCH_STATUS_CHIPS[status].icon,
      labelKey: `batches.kpi.status.${status}`,
      value: counts[status],
    }));
  });

  /**
   * Shows every status, or only the chosen one; choosing the active status again shows every status.
   *
   * @param status - The status of the indicator, or empty for every batch
   */
  protected choose(status: BatchStatus | ''): void {
    this.statusSelected.emit(status !== '' && this.selected() === status ? '' : status);
  }
}
