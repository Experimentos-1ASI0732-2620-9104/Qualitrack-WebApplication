import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { RaStore } from '../../../application/ra.store';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, BaseChartDirective],
  templateUrl: './kpi-dashboard.html',
  styleUrl: './kpi-dashboard.css',
})
export class KpiDashboardComponent {
  protected readonly store = inject(RaStore);
  private readonly iam = inject(IamStore);
  private readonly translate = inject(TranslateService);
  private readonly language = toSignal(this.translate.onLangChange);
  protected readonly barChartType = 'bar' as const;
  protected readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    plugins: { legend: { display: false } },
  };
  protected readonly chartData = computed<ChartData<'bar'>>(() => {
    this.language();
    const metrics = this.store.dashboard()?.metrics ?? [];
    return {
      labels: metrics.map(metric => this.translate.instant('operational-metrics.' + metric.name)),
      datasets: [{ data: metrics.map(metric => metric.value),
        backgroundColor: ['#2675be', '#13886f', '#bb4c66', '#82752a'] }],
    };
  });
  constructor() { this.reload(); }
  protected reload(): void { this.store.loadDashboard(this.iam.requireLaboratoryId()); }
}
