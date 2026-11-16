import { Component, input } from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { MeasurementSummary } from '../../../domain/model/kpi-dashboard.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Component that displays the environmental KPI summaries in a tabular format.
 *
 * @remarks
 * This component uses Angular Material's `MatTable` to render the average, minimum,
 * maximum, and latest reading for each variable. It is designed to be a pure
 * presentational component, receiving all data and the device resolution function
 * from its parent (`KpiDashboardComponent`).
 */
@Component({
  imports: [
    TablePaginator, MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRowDef,
    MatRowDef,
    TranslatePipe,
    DecimalPipe,
    DateTimePipe
  ],
  selector: 'app-kpi-table',
  styleUrl: './kpi-table.css',
  templateUrl: './kpi-table.html',
})
export class KpiTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly summaryPage = paginate(() => this.summaries());

  /** The raw measurement summaries returned by the API. */
  readonly summaries = input.required<MeasurementSummary[]>();

  /**
   * Function provided by the parent to resolve a device's display name from its ID.
   *
   * @remarks
   * Returns `null` if the device is not found in the store, allowing the template
   * to fall back to showing the raw ID.
   */
  readonly deviceNameFn = input.required<(id: number) => string | null>();

  /** The ordered list of column identifiers to render in the table header and rows. */
  protected readonly displayedColumns = ['device', 'variable', 'readings', 'average', 'minimum', 'maximum', 'lastReading'];
}
