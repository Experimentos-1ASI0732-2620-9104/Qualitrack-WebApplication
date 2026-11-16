import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { DashboardState } from '../../../../shared/presentation/components/dashboard-state/dashboard-state';
import { OverviewBatch } from '../../../domain/model/overview-batch.entity';

/**
 * Batch production section of the dashboard.
 *
 * @remarks
 * Displays a distribution bar chart of batch statuses and a list
 * of the most recently created batches.
 */
@Component({
  imports: [
    MatIcon,
    TranslatePipe,
    MatIconButton,
    RouterLink,
    MatTooltip,
    DashboardState
  ],
  selector: 'app-dashboard-batches',
  styleUrl: './dashboard-batches.css',
  templateUrl: './dashboard-batches.html',
})
export class DashboardBatches {
  /** Status of the batches request. */
  readonly batchesStatus = input.required<string>();

  /** Total number of batches, used to calculate the meter percentages. */
  readonly totalBatches = input.required<number>();

  /** Array of batch statuses and their counts. */
  readonly distribution = input.required<{ status: string; count: number }[]>();

  /** Array of the most recent batches. */
  readonly recentBatches = input.required<OverviewBatch[]>();

  /** Emits when the user clicks retry. */
  readonly retry = output<void>();
}
