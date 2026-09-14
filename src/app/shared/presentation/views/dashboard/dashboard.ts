import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardStore } from '../../../application/dashboard.store';

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatTooltipModule, MatProgressSpinnerModule, BaseChartDirective],
  providers: [DashboardStore], templateUrl: './dashboard.html', styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly store = inject(DashboardStore);
  private readonly translate = inject(TranslateService);
  private readonly language = toSignal(this.translate.onLangChange);
  protected readonly summaryCards = computed(() => [
    { key: 'equipment', value: this.store.equipment().data?.length, state: this.store.equipment().status,
      icon: 'precision_manufacturing', route: '/equipments/equipment-list', color: 'blue' },
    { key: 'in-progress', value: this.store.batches().data?.filter(item => item.status === 'IN_PROGRESS').length,
      state: this.store.batches().status, icon: 'inventory_2', route: '/batches/batch-list', color: 'teal' },
    { key: 'open-alerts', value: this.store.openAlerts().length, state: this.store.alerts().status,
      icon: 'warning_amber', route: '/alerts/alert-dashboard', color: 'red' },
    { key: 'low-stock', value: this.store.lowStock().length, state: this.store.materials().status,
      icon: 'inventory_2', route: '/inventory', color: 'amber' },
  ]);
  protected readonly batchStatuses = ['PENDING', 'IN_PROGRESS', 'RELEASED', 'REJECTED'] as const;
  protected readonly batchDistribution = computed(() => this.batchStatuses.map(status => ({ status,
    count: this.store.batches().data?.filter(batch => batch.status === status).length ?? 0 })));
  protected readonly recentBatches = computed(() => [...(this.store.batches().data ?? [])]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 4));
  protected readonly chartData = computed<ChartData<'line'>>(() => {
    this.language();
    return { datasets: [{ label: this.store.activeSeries()?.parameter,
      data: this.store.readings().map(point => ({ x: Date.parse(point.timestamp), y: point.value })),
      borderColor: '#158378', backgroundColor: '#15837818', pointRadius: 3,
      borderWidth: 2, fill: true, tension: 0 }] };
  });
  protected readonly chartOptions = computed<ChartOptions<'line'>>(() => {
    this.language();
    return { responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        title: items => this.formatDate(items[0].parsed.x ?? 0),
        label: item => `${item.parsed.y} ${this.store.activeSeries()?.unit ?? ''}`,
      } } },
      scales: { x: { type: 'linear', grid: { display: false }, ticks: { maxTicksLimit: 4, maxRotation: 0,
        callback: value => this.formatDate(Number(value), true) } },
        y: { title: { display: true, text: this.store.activeSeries()?.unit ?? '' } } } };
  });
  protected readonly reloadAll = () => this.store.reload();
  protected readonly retryTelemetry = () => this.store.selectEquipment(this.store.selectedEquipmentId());
  protected readonly retrySubscription = () => this.store.loadSubscription();
  protected readonly retryAlerts = () => this.store.equipment().status === 'ready' ? this.store.loadAlerts() : this.store.reload();
  constructor() { this.store.reload(); }
  protected formatDate(value: string | number, short = false): string {
    this.language();
    const locale = this.translate.getCurrentLang()?.startsWith('es') ? 'es-PE' : 'en-US';
    return new Intl.DateTimeFormat(locale, short
      ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
      : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }
}
