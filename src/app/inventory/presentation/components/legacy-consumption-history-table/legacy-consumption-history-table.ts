import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { MaterialConsumption } from '../../../domain/model/material-consumption.entity';
import { ConsumingBatch } from '../../../domain/model/consuming-batch.entity';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Usages of a raw material from before Inventory in production batches, with its balance when it was recorded.
 */
@Component({
  selector: 'app-legacy-consumption-history-table',
  standalone: true,
  imports: [TablePaginator, DecimalPipe, RouterLink, TranslatePipe, DateTimePipe],
  templateUrl: './legacy-consumption-history-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './legacy-consumption-history-table.css',
})
export class LegacyConsumptionHistoryTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly consumptionPage = paginate(() => this.consumptions());

  /** Usages to show, one per row. */
  readonly consumptions = input.required<readonly MaterialConsumption[]>();

  /** Production batches that consumed the material, to show their number; an unknown batch shows its identifier. */
  readonly batches = input.required<readonly ConsumingBatch[]>();

  /** Number of each production batch by identifier. */
  protected readonly batchNames = computed(
    () => new Map(this.batches().map((batch) => [batch.id, batch.batchNumber])),
  );
}
