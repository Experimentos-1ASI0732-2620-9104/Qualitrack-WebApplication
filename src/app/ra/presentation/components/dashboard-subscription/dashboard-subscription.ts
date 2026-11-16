import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardState } from '../../../../shared/presentation/components/dashboard-state/dashboard-state';
import { OverviewPlan } from '../../../domain/model/overview-plan.entity';
import { OverviewSubscription } from '../../../domain/model/overview-subscription.entity';

/**
 * Subscription section of the dashboard.
 *
 * @remarks
 * Displays the current billing plan details (cycle, price, limits)
 * and a button to manage billing.
 * Only visible to users with the 'manageSubscription' permission.
 */
@Component({
  selector: 'app-dashboard-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, MatIconModule, MatButtonModule, DashboardState],
  templateUrl: './dashboard-subscription.html',
  styleUrl: './dashboard-subscription.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSubscription {
  /** Status of the subscription request. */
  readonly status = input.required<string>();

  /** The active subscription object. */
  readonly subscription = input.required<OverviewSubscription | null>();

  /** The catalog plan details associated with the subscription. */
  readonly currentPlan = input.required<OverviewPlan | null>();

  /** Status of the catalog plans request. */
  readonly plansStatus = input.required<string>();

  /** Utility function to format dates. */
  readonly formatDate = input.required<(value: string | number, short?: boolean) => string>();

  /** Emits when the user clicks retry. */
  readonly retry = output<void>();
}
