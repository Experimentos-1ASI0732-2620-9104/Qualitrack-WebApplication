import { Component, input, output } from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { DeviationTrend, TrendDirection } from '../../../domain/model/deviation-trend.entity';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Presentational component that renders a table of deviation trends.
 *
 * @remarks
 * This component displays the list of variables, their time-in-range percentage,
 * deviation counts, and trend direction. It emits an event when a row is selected,
 * allowing the parent component to update the active chart.
 */
@Component({
  imports: [
    TablePaginator, MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    MatIcon,
    MatHeaderRow,
    MatRow,
    TranslatePipe,
    MatRowDef,
    MatHeaderRowDef,
    DecimalPipe,
  ],
  selector: 'app-deviation-table',
  styleUrl: './deviation-table.css',
  templateUrl: './deviation-table.html',
})
export class DeviationTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly trendPage = paginate(() => this.trends());

  /** The list of deviation trends to display in the table. */
  readonly trends = input.required<DeviationTrend[]>();

  /** Function to resolve a device ID to its human-readable label. */
  readonly deviceLabel = input.required<(id: number) => string>();

  /** Function that returns the Material Icon name based on the trend direction (e.g., 'INCREASING'). */
  readonly trendIcon = input.required<(direction: TrendDirection) => string>();

  /** Function to determine if a specific trend row is currently active/selected. */
  readonly isActive = input.required<(trend: DeviationTrend) => boolean>();

  /** Emits the selected trend when the user clicks on a row. */
  readonly select = output<DeviationTrend>();

  /** Defines the column order and keys for the Material table. */
  protected readonly columns = ['variable', 'timeInRange', 'deviations', 'critical', 'trend'];
}
