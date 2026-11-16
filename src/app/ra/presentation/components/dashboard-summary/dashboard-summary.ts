import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Represents a summary card item. */
export interface SummaryCard {
  key: string;
  value: number | undefined;
  state: string;
  icon: string;
  route: string;
  color: string;
}

/**
 * Presentational component for the top summary cards.
 *
 * @remarks
 * Renders a grid of links showing total equipment, active batches,
 * open alerts, and low stock materials.
 */
@Component({
  imports: [
    MatIcon,
    RouterLink,
    TranslatePipe
  ],
  selector: 'app-dashboard-summary',
  styleUrl: './dashboard-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-summary.html',
})
export class DashboardSummary {
  /** Array of cards to display. */
  readonly cards = input.required<SummaryCard[]>();

}
