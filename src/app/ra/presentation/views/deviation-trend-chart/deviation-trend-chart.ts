import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

import { RaStore } from '../../../application/ra.store';
import { DeviationTrend, ReadingState, TrendDirection } from '../../../domain/model/deviation-trend.entity';
import { lastDays } from '../../../domain/model/indicator-period';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';

/** Lengths of the period offered, in days; the platform accepts up to 31. */
const PERIOD_DAYS = [1, 7, 31] as const;

const STATE_COLORS: Record<ReadingState, string> = { NORMAL: '#158378', WARNING: '#c08a00', CRITICAL: '#c62828' };

/**
 * Deviation indicators of an environment (US94): for each device and variable, the time in range, the deviations and
 * the critical deviations of the period, calculated by the platform from the evaluated readings, with their chart.
 */
@Component({
  selector: 'app-deviation-trend-chart',
  standalone: true,
  imports: [DecimalPipe, TranslateModule, MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatProgressSpinnerModule, BaseChartDirective, EnvironmentSelector],
  templateUrl: './deviation-trend-chart.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', '../reporting-views.css'],
})
export class DeviationTrendChartComponent implements OnInit {
  protected readonly store = inject(RaStore);
  protected readonly environments = inject(EnvironmentStore);
  private readonly translate = inject(TranslateService);
  private readonly language = toSignal(this.translate.onLangChange, { initialValue: null });

  protected readonly periods = PERIOD_DAYS;
  protected readonly days = signal<number>(7);
  protected readonly environmentId = signal<number | null>(null);
  private readonly selectedKey = signal<string | null>(null);

  /** Indicator drawn in the chart: the selected one, or the first of the environment. */
  protected readonly activeTrend = computed(() => {
    const trends = this.store.deviationTrends();
    return trends.find((trend) => this.key(trend) === this.selectedKey()) ?? trends[0] ?? null;
  });

  protected readonly chartData = computed<ChartData<'line'>>(() => {
    this.language();
    const trend = this.activeTrend();
    if (!trend) return { datasets: [] };
    const points = trend.dataPoints.map((point) => ({ x: Date.parse(point.timestamp), y: point.recordedValue }));
    const colors = trend.dataPoints.map((point) => point.state ? STATE_COLORS[point.state] : '#7d8f96');
    return {
      datasets: [{
        label: this.translate.instant('tracking.metrics.' + trend.parameterName),
        data: points, borderColor: '#8fa7ae', borderWidth: 1.5, tension: 0,
        pointRadius: 3, pointBackgroundColor: colors, pointBorderColor: colors,
      }],
    };
  });

  protected readonly chartOptions = computed<ChartOptions<'line'>>(() => {
    this.language();
    const trend = this.activeTrend();
    const unit = trend?.unit ?? '';
    return {
      responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          title: (items) => this.formatDate(items[0].parsed.x ?? 0),
          label: (item) => {
            const state = trend?.dataPoints[item.dataIndex]?.state;
            const condition = state ? ` · ${this.translate.instant('tracking.states.' + state)}` : '';
            return `${item.parsed.y} ${unit}${condition}`;
          },
        } },
      },
      scales: {
        x: { type: 'linear', grid: { display: false },
          ticks: { maxTicksLimit: 6, maxRotation: 0, callback: (value) => this.formatDate(Number(value)) } },
        y: { title: { display: true, text: unit } },
      },
    };
  });

  async ngOnInit(): Promise<void> {
    this.store.loadDevices();
    if (!this.environments.loaded()) await this.environments.loadEnvironments();
    const preferred = this.environments.preferredEnvironment(undefined, 'tracking');
    if (preferred) this.changeEnvironment(preferred.id);
  }

  protected changeEnvironment(environmentId: number): void {
    this.environments.rememberEnvironment(environmentId, 'tracking');
    this.environmentId.set(environmentId);
    this.reload();
  }

  protected changePeriod(days: number): void {
    this.days.set(days);
    this.reload();
  }

  protected reload(): void {
    const environmentId = this.environmentId();
    if (environmentId === null) return;
    this.store.loadDeviationTrends(environmentId, lastDays(this.days()));
  }

  protected select(trend: DeviationTrend): void {
    this.selectedKey.set(this.key(trend));
  }

  protected isActive(trend: DeviationTrend): boolean {
    const active = this.activeTrend();
    return !!active && this.key(active) === this.key(trend);
  }

  protected deviceLabel(deviceId: number): string {
    return this.store.deviceName(deviceId) ?? `#${deviceId}`;
  }

  protected trendIcon(direction: TrendDirection): string {
    switch (direction) {
      case 'INCREASING':
        return 'trending_up';
      case 'DECREASING':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }

  private key(trend: DeviationTrend): string {
    return `${trend.equipmentId}|${trend.parameterName}|${trend.unit ?? ''}`;
  }

  private formatDate(value: number): string {
    return new Intl.DateTimeFormat(this.translate.currentLang || 'en', { dateStyle: 'short', timeStyle: 'short' })
      .format(new Date(value));
  }
}
