import { Component, OnInit, effect, untracked, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

import { TrackingStore } from '../../../application/tracking.store';
import { EquipmentStore } from '../../../../equipment/application/equipment.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Component responsible for rendering analytical telemetry charts.
 *
 * @remarks
 * In the presentation layer, this component provides a detailed visual analysis
 * of historical telemetry points for a selected equipment. It allows users to
 * filter by equipment and date range, then renders the resulting time series
 * with anomaly-aware visual indicators.
 */
@Component({
  selector: 'app-telemetry-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  templateUrl: './telemetry-chart.html',
  styleUrl: './telemetry-chart.css',
})
export class TelemetryChartComponent implements OnInit {
  /**
   * Store that manages Tracking bounded context state.
   */
  protected readonly store = inject(TrackingStore);

  /**
   * Store that manages Equipment bounded context state.
   */
  protected readonly equipmentStore = inject(EquipmentStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Translation service used to resolve dynamic chart labels and tooltip text.
   */
  private readonly translate = inject(TranslateService);

  /**
   * Current filter state used to query telemetry history for chart analysis.
   *
   * @remarks
   * Equipment identifiers are numeric to stay aligned with the backend API.
   * Date values are converted to ISO strings before being sent as query params.
   */
  protected filters = {
    equipmentId: null as number | null,
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  };

  /**
   * Selects the first recorded equipment once the server response is available.
   */
  constructor() {
    effect(() => {
      const first = this.equipmentStore.equipmentList()[0];
      if (this.equipmentStore.isLoading() || this.equipmentStore.error() || !first) return;
      untracked(() => {
        if (this.filters.equipmentId) return;
        this.filters.equipmentId = first.id;
        this.loadChartData();
      });
    });
  }

  /**
   * Retrieves the current laboratory ID based on the authenticated context.
   *
   * @remarks
   * The value is converted to number to keep consistency with the backend API.
   */
  private get currentLabId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Configuration options for the analytical telemetry line chart.
   */
  protected readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) =>
            `${this.translate.instant('tracking.analysis.value')}: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: false },
    },
    elements: {
      point: { radius: 3, hoverRadius: 6 },
      line: { tension: 0.3, borderWidth: 2 },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  /**
   * Computed chart data generated from historical telemetry points.
   *
   * @remarks
   * The history is sorted chronologically before rendering. Anomalous points
   * and the line segments connected to them are highlighted to make deviations
   * visible during analysis.
   */
  protected readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const sortedHistory = this.store.selectedHistory();

    return {
      labels: sortedHistory.map((point) =>
        new Date(point.timestamp).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ),
      datasets: [
        {
          data: sortedHistory.map((point) => point.recordedValue),
          label: this.store.activeHistoryParameter() ?? '',
          fill: true,
          borderColor: '#1a3a5c',
          backgroundColor: 'rgba(26, 58, 92, 0.05)',
          pointBackgroundColor: sortedHistory.map((point) =>
            point.isAnomaly ? '#d32f2f' : '#1a3a5c',
          ),
          pointBorderColor: '#ffffff',
          segment: {
            borderColor: (context) => {
              const previousPointIsAnomaly = sortedHistory[context.p0DataIndex]?.isAnomaly;
              const currentPointIsAnomaly = sortedHistory[context.p1DataIndex]?.isAnomaly;

              return previousPointIsAnomaly || currentPointIsAnomaly ? '#d32f2f' : '#1a3a5c';
            },
          },
        },
      ],
    };
  });

  /**
   * Lifecycle hook that loads equipment and initializes chart data.
   *
   * @remarks
   * Once equipment data is available, the first equipment is selected
   * automatically and its historical telemetry is loaded.
   */
  ngOnInit(): void {
    this.equipmentStore.loadEquipment(this.currentLabId);
  }


  /**
   * Loads historical telemetry data using the current chart filters.
   */
  protected loadChartData(): void {
    if (!this.filters.equipmentId) return;

    const query: { equipmentId: number; from?: string; to?: string } = {
      equipmentId: this.filters.equipmentId,
    };

    if (this.filters.dateFrom) {
      query.from = this.filters.dateFrom.toISOString();
    }

    if (this.filters.dateTo) {
      query.to = this.filters.dateTo.toISOString();
    }

    this.store.loadTelemetryHistory(query);
  }

  /**
   * Clears the selected date range and reloads chart data for the selected equipment.
   */
  protected clearFilters(): void {
    this.filters.dateFrom = null;
    this.filters.dateTo = null;
    this.loadChartData();
  }

}
