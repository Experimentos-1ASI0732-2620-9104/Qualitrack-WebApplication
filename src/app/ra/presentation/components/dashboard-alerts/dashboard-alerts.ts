import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardState } from '../../../../shared/presentation/components/dashboard-state/dashboard-state';
import { OverviewAlert } from '../../../domain/model/overview-alert.entity';

/**
 * Alerts section of the dashboard.
 *
 * @remarks
 * Displays a list of the most recent open alerts, showing severity,
 * equipment name, and parameter details.
 */
@Component({
  imports: [
    MatIcon,
    MatIconButton,
    RouterLink,
    MatTooltip,
    TranslatePipe,
    DashboardState
  ],
  selector: 'app-dashboard-alerts',
  styleUrl: './dashboard-alerts.css',
  templateUrl: './dashboard-alerts.html',
})
export class DashboardAlerts {
  /** Status of the alerts request. */
  readonly alertsStatus = input.required<string>();

  /** List of open alerts. */
  readonly openAlerts = input.required<OverviewAlert[]>();

  /** Utility function to resolve the equipment name from an ID. */
  readonly equipmentName = input.required<(id: number) => string>();

  /** Utility function to format dates. */
  readonly formatDate = input.required<(value: string | number, short?: boolean) => string>();

  /** Emits when the user clicks retry. */
  readonly retry = output<void>();
}
