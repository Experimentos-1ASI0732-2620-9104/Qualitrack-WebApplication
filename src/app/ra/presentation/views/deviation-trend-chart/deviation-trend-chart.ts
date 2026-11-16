import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { RaStore } from '../../../application/ra.store';
import { DeviationTrend, TrendDirection } from '../../../domain/model/deviation-trend.entity';
import { lastDays } from '../../../domain/model/indicator-period';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';

import { DeviationTable } from '../../components/deviation-table/deviation-table';
import { DeviationKpiCards } from '../../components/deviation-kpi-cards/deviation-kpi-cards';
import { DeviationChart } from '../../components/deviation-chart/deviation-chart';
import { DeviationChartFactory } from '../../components/deviation-chart/deviation-chart.factory';
import { SetupNotice } from '../../../../shared/presentation/components/setup-notice/setup-notice';
import { IamStore } from '../../../../iam/application/iam.store';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { REPORTS_TABS } from '../../reports-tabs';

const PERIOD_DAYS = [1, 7, 31] as const;
const DEFAULT_PERIOD_DAYS = 7;

/**
 * Smart component for the main Deviation Trend Chart view.
 *
 * @remarks
 * This component orchestrates the KPI cards, the data table, and the chart visualization.
 * Its state (selected environment, period, and active trend) lives in the URL query parameters, so the view can be
 * shared and reloaded: the controls change the address and the view follows it. The readings are only read again when
 * the environment or the period change, not when another row of the table is chosen.
 */
@Component({
  selector: 'app-deviation-trend-chart',
  standalone: true,
  imports: [
    PageHeader,
    ListToolbar,
    FilterChip,
    SetupNotice,
    TranslatePipe,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EnvironmentSelector,
    DeviationKpiCards,
    DeviationTable,
    DeviationChart
  ],
  templateUrl: './deviation-trend-chart.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './deviation-trend-chart.css',
})
export class DeviationTrendChartComponent implements OnInit {
  /** Operations of the reports module. */
  protected readonly tabs = REPORTS_TABS;

  /** Reads the trends of the environment and the period again. */
  protected reload(): void {
    const environmentId = this.environmentId();
    if (environmentId !== null) this.store.loadDeviationTrends(environmentId, lastDays(this.days()));
  }

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(RaStore);
  protected readonly iam = inject(IamStore);
  private readonly translate = inject(TranslateService);

  /** Signal used to trigger recalculations when the language changes. */
  private readonly language = toSignal(this.translate.onLangChange, { initialValue: null });

  /** Environment and period of the readings read last. */
  private loadedScope: string | null = null;

  /** Available period options (in days). */
  protected readonly periods = PERIOD_DAYS;

  /** Currently selected period in days. */
  protected readonly days = signal<number>(DEFAULT_PERIOD_DAYS);

  /** Currently selected environment ID. */
  protected readonly environmentId = signal<number | null>(null);

  /** Internal key to track the currently selected trend from the table. */
  private readonly selectedKey = signal<string | null>(null);

  /**
   * The trend to display in the chart and table.
   * Falls back to the first trend if none is explicitly selected.
   */
  protected readonly activeTrend = computed(() => {
    const trends = this.store.deviationTrends();
    return trends.find((trend) => this.key(trend) === this.selectedKey()) ?? trends[0] ?? null;
  });

  /** The limits of the active trend, from the profile of its device; null when it has none. */
  protected readonly activeThresholds = computed(() => {
    const trend = this.activeTrend();
    return trend ? (this.store.profiles()[trend.equipmentId]?.threshold(trend.parameterName) ?? null) : null;
  });

  /** Whether the profile of the device of the active trend has not been read yet. */
  protected readonly thresholdsPending = computed(() => {
    const trend = this.activeTrend();
    return trend !== null && !(trend.equipmentId in this.store.profiles());
  });

  /** Computes the Chart.js data object using the factory. */
  protected readonly chartData = computed(() =>
    DeviationChartFactory.createChartData(this.activeTrend())
  );

  /** Computes the Chart.js options object using the factory. Re-runs on language change. */
  protected readonly chartOptions = computed(() => {
    this.language();
    return DeviationChartFactory.createChartOptions(
      this.activeTrend(),
      this.activeThresholds(),
      this.translate
    );
  });

  constructor() {
    // Effect to fetch environmental profiles whenever the trends or environment change.
    // This is required to render the correct threshold colors in the chart.
    effect(() => {
      const trends = this.store.deviationTrends();
      const envId = this.environmentId();
      if (envId !== null) {
        for (const t of trends) {
          if (t.equipmentId) this.store.loadProfile(t.equipmentId, envId);
        }
      }
    });
  }

  /**
   * Initializes the component and starts following the URL query parameters.
   *
   * @remarks
   * Profiles can have changed since the last visit, so they are read again.
   */
  async ngOnInit() {
    this.store.clearProfiles();
    this.store.loadDevices();
    await this.store.loadEnvironments();

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.followAddress(params));
  }

  /** Handles environment changes and updates the URL, which the view follows. */
  protected changeEnvironment(environmentId: number) {
    this.store.rememberEnvironment(environmentId);
    this.environmentId.set(environmentId);
    this.updateUrl();
  }

  /** Handles period changes and updates the URL, which the view follows. */
  protected changePeriod(days: number) {
    this.days.set(days);
    this.updateUrl();
  }

  /** Selects a trend from the table to be displayed, and updates the URL. */
  protected select(trend: DeviationTrend) {
    this.selectedKey.set(this.key(trend));
    this.updateUrl();
  }

  /** Checks if a given trend is the currently active one. */
  protected readonly isActive = (trend: DeviationTrend): boolean => {
    const activeTrend = this.activeTrend();
    return activeTrend !== null && this.key(activeTrend) === this.key(trend);
  };

  /** Resolves a device ID to its human-readable label. */
  protected readonly deviceLabel = (id: number): string => this.store.deviceName(id) ?? `#${id}`;

  /** Returns the Material Icon name for a given trend direction. */
  protected readonly trendIcon = (direction: TrendDirection): string =>
    direction === 'INCREASING'
      ? 'trending_up'
      : direction === 'DECREASING'
        ? 'trending_down'
        : 'trending_flat';

  /**
   * Navigates to the detailed events view.
   *
   * @remarks
   * Passes the current `days` and `env` as query parameters to ensure
   * the detail view can reload the data correctly.
   */
  protected openDetail(trend: DeviationTrend) {
    this.router.navigate([
      '/reports/deviation-trends',
      trend.equipmentId,
      encodeURIComponent(trend.parameterName),
    ], {
      queryParams: { days: this.days(), env: this.environmentId() }
    });
  }

  /**
   * Shows what the address says and reads the trends when the environment or the period are not the ones already read.
   *
   * @param params - The query parameters of the address
   *
   * @remarks
   * Without an environment in the address it uses the one preferred in this browser and writes it there.
   */
  private followAddress(params: Params) {
    const days = Number(params['days']);
    const environmentId = Number(params['env']) || this.store.preferredEnvironmentId();
    this.days.set((PERIOD_DAYS as readonly number[]).includes(days) ? days : DEFAULT_PERIOD_DAYS);
    this.selectedKey.set(params['selected'] ?? null);
    this.environmentId.set(environmentId);
    if (environmentId === null) return;

    const scope = `${environmentId}|${this.days()}`;
    if (scope !== this.loadedScope) {
      this.loadedScope = scope;
      this.store.loadDeviationTrends(environmentId, lastDays(this.days()));
    }
    if (!params['env']) this.updateUrl();
  }

  /** Synchronizes the current component state with the URL query parameters. */
  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        days: this.days(),
        env: this.environmentId(),
        selected: this.selectedKey()
      },
      queryParamsHandling: 'merge',
      replaceUrl: true // Prevents polluting the browser history with every click
    });
  }

  /** Generates a unique key for a trend to identify it in the UI. */
  private key(trend: DeviationTrend) {
    return `${trend.equipmentId}|${trend.parameterName}|${trend.unit ?? ''}`;
  }
}
