import { Component, input, ChangeDetectionStrategy, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { DeviationTrend } from '../../../domain/model/deviation-trend.entity';
import { OverviewEnvironmentalThreshold } from '../../../domain/model/overview-environmental-profile.entity';
import { DeviationChartFactory } from './deviation-chart.factory';

// Register the annotation plugin globally for this module.
Chart.register(annotationPlugin);

/**
 * Presentational component that renders the deviation line chart and its custom legend.
 *
 * @remarks
 * This component is purely "dumb" (OnPush). It receives all chart data and options
 * from its parent and only emits user interactions (openDetail) back up.
 */
@Component({
  selector: 'app-deviation-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe, MatButtonModule, MatIconModule, BaseChartDirective],
  templateUrl: './deviation-chart.html',
  styleUrl: './deviation-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviationChart {
  /** The raw deviation trend data, used for display labels. */
  readonly trend = input.required<DeviationTrend>();

  /** The pre-configured data object for Chart.js. */
  readonly chartData = input.required<ChartData<'line'>>();

  /** The pre-configured options object for Chart.js. */
  readonly chartOptions = input.required<ChartOptions<'line'>>();

  /** Function to resolve a device ID to its human-readable label. */
  readonly deviceLabel = input.required<(id: number) => string>();

  /** The limits of the variable, or null when it has none. */
  readonly thresholds = input<OverviewEnvironmentalThreshold | null>(null);

  /** Whether the limits are still being read, so nothing is said about them yet. */
  readonly thresholdsPending = input(false);

  /** Emitted when the user clicks the "View more details" button. */
  readonly openDetail = output<void>();

  /** Conditions shown below the chart. */
  protected readonly legend = computed(() => {
    const thresholds = this.thresholds();
    return thresholds ? DeviationChartFactory.createLegend(thresholds, this.trend().unit ?? '') : [];
  });
}
