import { Component, computed, inject, ChangeDetectionStrategy, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChartData, ChartOptions } from 'chart.js';
import { RaStore } from '../../../application/ra.store';
import { DashboardSummary } from '../../components/dashboard-summary/dashboard-summary';
import { DashboardTelemetry } from '../../components/dashboard-telemetry/dashboard-telemetry';
import { DashboardAlerts } from '../../components/dashboard-alerts/dashboard-alerts';
import { DashboardBatches } from '../../components/dashboard-batches/dashboard-batches';
import { DashboardSubscription } from '../../components/dashboard-subscription/dashboard-subscription';
import { formatDateTime } from '../../../../shared/presentation/utils/date-time-format';
import { LABORATORY_TIME_ZONE } from '../../../../shared/presentation/utils/local-date';

/**
 * Orchestrator component for the main Dashboard.
 *
 * @remarks
 * This component acts as a bridge between the global `RaStore` and its
 * sub-components (`DashboardSummary`, `DashboardTelemetry`, `DashboardSubscription`,
 * `DashboardAlerts`, and `DashboardBatches`).
 *
 * It computes derived data (like chart configurations and batch distributions)
 * and passes the data down to the pure presentational components.
 *
 * Another context can tell something on arrival: the route hands the dashboard a component to render (see
 * `app.routes.ts`), so the dashboard does not import that context.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    DashboardSummary,
    DashboardTelemetry,
    DashboardAlerts,
    DashboardBatches,
    DashboardSubscription
  ],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dashboard.css',
})
export class Dashboard {
  /** The application store managing the state for the Reporting and Analysis bounded context. */
  protected readonly store = inject(RaStore);

  /** Translation service for language formatting. */
  private readonly translate = inject(TranslateService);

  /** Component that the route hands over, rendered as it is. */
  protected readonly noticeComponent = (inject(ActivatedRoute).snapshot.data['noticeComponent'] ?? null) as Type<unknown> | null;

  /** Re-evaluates when the language changes to reformat dates in charts. */
  private readonly language = toSignal(this.translate.onLangChange);

  /** Data for the top summary cards. */
  protected readonly summaryCards = computed(() => [
    {
      key: 'equipment',
      value: this.store.overviewEquipment().data?.length,
      state: this.store.overviewEquipment().status,
      icon: 'precision_manufacturing',
      route: '/equipments',
      color: 'blue',
    },
    {
      key: 'in-progress',
      value: this.store.overviewBatches().data?.filter((item) => item.status === 'IN_PROGRESS').length,
      state: this.store.overviewBatches().status,
      icon: 'inventory_2',
      route: '/batches',
      color: 'teal',
    },
    {
      key: 'open-alerts',
      value: this.store.overviewOpenAlerts().length,
      state: this.store.overviewAlerts().status,
      icon: 'warning_amber',
      route: '/alerts',
      color: 'red',
    },
    {
      key: 'low-stock',
      value: this.store.overviewLowStock().length,
      state: this.store.overviewMaterials().status,
      icon: 'inventory_2',
      route: '/inventory',
      color: 'amber',
    },
  ]);

  /** List of batch statuses used for the distribution chart. */
  protected readonly batchStatuses = ['PENDING', 'IN_PROGRESS', 'RELEASED', 'REJECTED'] as const;

  /** Computes the count of batches per status. */
  protected readonly batchDistribution = computed(() =>
    this.batchStatuses.map((status) => ({
      status,
      count: this.store.overviewBatches().data?.filter((batch) => batch.status === status).length ?? 0,
    })),
  );

  /** Retrieves the 4 most recent batches. */
  protected readonly recentBatches = computed(() =>
    [...(this.store.overviewBatches().data ?? [])].sort((a, b) => b.id - a.id).slice(0, 4),
  );

  /** Configuration object for the telemetry line chart. */
  protected readonly chartData = computed<ChartData<'line'>>(() => {
    this.language();
    return {
      datasets: [
        {
          label: this.store.overviewActiveSeries()?.parameter,
          data: this.store
            .overviewReadings()
            .map((point) => ({ x: Date.parse(point.measuredAt), y: point.value ?? 0 })),
          borderColor: '#158378',
          backgroundColor: '#15837818',
          pointRadius: 3,
          borderWidth: 2,
          fill: true,
          tension: 0,
        },
      ],
    };
  });

  /** Options object for the telemetry line chart. */
  protected readonly chartOptions = computed<ChartOptions<'line'>>(() => {
    this.language();
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => this.formatDate(items[0].parsed.x ?? 0),
            label: (item) => `${item.parsed.y} ${this.store.overviewActiveSeries()?.unit ?? ''}`,
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          grid: { display: false },
          ticks: {
            maxTicksLimit: 4,
            maxRotation: 0,
            callback: (value) => this.formatDate(Number(value), true),
          },
        },
        y: { title: { display: true, text: this.store.overviewActiveSeries()?.unit ?? '' } },
      },
    };
  });

  /** Triggers a full reload of the dashboard data. */
  protected readonly reloadAll = () => this.store.reloadOverview();

  /** Retries loading the telemetry data for the currently selected device. */
  protected readonly retryTelemetry = () =>
    this.store.selectOverviewDevice(this.store.overviewDeviceId());

  /** Retries loading the subscription data. */
  protected readonly retrySubscription = () => this.store.loadOverviewSubscription();

  /** Retries loading the alerts data. */
  protected readonly retryAlerts = () => this.store.loadOverviewAlerts();

  /** Initializes the dashboard by loading the overview data. */
  constructor() {
    this.store.reloadOverview();
  }

  /**
   * Formats a date string or timestamp into a localized string.
   *
   * @param value - The date value (string or timestamp number)
   * @param short - If true, returns only time (HH:mm). Otherwise, returns date and time.
   * @returns The formatted date string.
   */
  protected formatDate(value: string | number, short = false): string {
    this.language();
    const language = this.translate.getCurrentLang() || 'en';
    if (!short) return formatDateTime(new Date(value), language);
    return new Intl.DateTimeFormat(language.startsWith('es') ? 'es-PE' : 'en-US', {
      timeZone: LABORATORY_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(value));
  }
}
