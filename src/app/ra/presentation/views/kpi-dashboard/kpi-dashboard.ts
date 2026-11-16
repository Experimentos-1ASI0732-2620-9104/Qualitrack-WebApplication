import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  effect
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { RaStore } from '../../../application/ra.store';
import { ALL_ENVIRONMENTS, lastDays } from '../../../domain/model/indicator-period';
import { KpiSummaryCards } from '../../components/kpi-summary-cards/kpi-summary-cards';
import { KpiTable } from '../../components/kpi-table/kpi-table';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { REPORTS_TABS } from '../../reports-tabs';

/** Lengths of the period offered, in days; the platform accepts up to 31. */
const PERIOD_DAYS = [1, 7, 31] as const;

/**
 * Indicators of the laboratory: average, minimum and maximum of the environmental readings of a period per device and
 * variable (US93), and the current counts of its records. Every value comes from persisted records; without readings
 * nothing is calculated.
 *
 * @remarks
 * This component acts as an orchestrator for the KPI dashboard. It manages the global filters
 * (period and environment), calculates the grouped summaries, and handles the logic
 * to load the necessary environmental profiles to color-code the cards correctly.
 */
@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [
    PageHeader,
    ListToolbar,
    FilterChip,
    DateTimePipe,
    TranslatePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    EnvironmentSelector,
    MatProgressSpinnerModule,
    KpiSummaryCards,
    KpiTable
  ],
  templateUrl: './kpi-dashboard.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './kpi-dashboard.css',
})
export class KpiDashboardComponent implements OnInit {
  /** Operations of the reports module. */
  protected readonly tabs = REPORTS_TABS;

  /** The application store managing the Reporting and Analysis state. */
  protected readonly store = inject(RaStore);

  /** Available period options in days. */
  protected readonly periods = PERIOD_DAYS;

  /** Constant representing the "All environments" selection. */
  protected readonly ALL_ENVIRONMENTS = ALL_ENVIRONMENTS;

  /** Selected period in days. */
  protected readonly days = signal<number>(7);

  /** Selected environment, or null for all. */
  protected readonly environmentId = signal<number | null>(null);

  /** Resolves the display name of a device, or null when it is unknown. */
  protected readonly deviceName = (id: number): string | null => this.store.deviceName(id);

  /** Current view mode: 'cards' or 'table'. */
  protected readonly viewMode = signal<'cards' | 'table'>('cards');

  /**
   * Readings summarized per environment, ordered as the laboratory environments.
   * Groups are filtered to only show environments that actually have summaries.
   */
  protected readonly groups = computed(() => {
    const summaries = this.store.dashboard()?.measurementSummaries ?? [];
    return this.store
      .environments()
      .map((environment) => ({
        environment,
        summaries: summaries.filter((item) => item.environmentId === environment.id),
      }))
      .filter((group) => group.summaries.length);
  });

  /**
   * Creates an instance of KpiDashboardComponent.
   *
   * @remarks
   * The constructor sets up an `effect` that automatically loads the environmental profiles
   * (thresholds) for every device present in the dashboard summaries. This is required
   * to calculate the visual state (normal, warning, critical) of the KPI cards.
   */
  constructor() {
    effect(() => {
      const summaries = this.store.dashboard()?.measurementSummaries ?? [];
      for (const s of summaries) {
        if (s.deviceId != null && s.environmentId != null) {
          this.store.loadProfile(s.deviceId, s.environmentId);
        }
      }
    });
  }

  /**
   * Lifecycle hook that initializes the dashboard.
   * Loads devices, ensures environments are loaded, and triggers the first data fetch.
   * Profiles can have changed since the last visit, so they are read again.
   */
  async ngOnInit(): Promise<void> {
    this.store.clearProfiles();
    this.store.loadDevices();
    await this.store.loadEnvironments();
    this.reload();
  }

  /**
   * Changes the selected period and reloads the dashboard data.
   *
   * @param days - The number of days for the new period.
   */
  protected changePeriod(days: number): void {
    this.days.set(days);
    this.reload();
  }

  /**
   * Changes the selected environment and reloads the dashboard data.
   *
   * @param environmentId - The environment identifier, or ALL_ENVIRONMENTS.
   */
  protected changeEnvironment(environmentId: number): void {
    this.environmentId.set(environmentId === ALL_ENVIRONMENTS ? null : environmentId);
    this.reload();
  }

  /**
   * Switches the visualization mode between cards and table.
   *
   * @param mode - The new view mode.
   */
  protected changeView(mode: 'cards' | 'table'): void {
    this.viewMode.set(mode);
  }

  /**
   * Fetches the dashboard data from the store using the selected filters.
   */
  protected reload(): void {
    this.store.loadDashboard(lastDays(this.days()), this.environmentId());
  }
}
