import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialConsumption } from '../../../domain/model/material-consumption.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Consumption recorded before a raw material was imported to Inventory.
 */
@Component({
  selector: 'app-legacy-material-history-table',
  standalone: true,
  imports: [TablePaginator, DecimalPipe, RouterLink, TranslatePipe, DateTimePipe],
  templateUrl: './legacy-material-history-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './legacy-material-history-table.css',
})
export class LegacyMaterialHistoryTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly historyPage = paginate(() => this.history());

  /** Consumption to show, one per row. */
  readonly history = input.required<readonly MaterialConsumption[]>();
}
