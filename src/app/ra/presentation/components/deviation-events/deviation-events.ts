import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { DataPoint, DeviationTrend } from '../../../domain/model/deviation-trend.entity';
import { OverviewEnvironmentalThreshold } from '../../../domain/model/overview-environmental-profile.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { crossedLimit } from '../deviation-chart/deviation-chart.factory';

/**
 * Presentational component that renders a list of deviation events (warnings and criticals).
 *
 * @remarks
 * This component is highly reusable. It can either calculate the events itself based on
 * the provided trend, or it can act as a "dumb" component and simply display a pre-filtered
 * list of points provided by a parent component.
 */
@Component({
  imports: [TranslatePipe, DateTimePipe, DecimalPipe],
  selector: 'app-deviation-events',
  styleUrl: './deviation-events.css',
  templateUrl: './deviation-events.html',
})
export class DeviationEvents {
  /** The overall deviation trend data. Used for labels and as a fallback data source. */
  readonly trend = input.required<DeviationTrend>();

  /**
   * An optional pre-filtered list of events.
   * If provided, the component bypasses its internal filtering logic.
   */
  readonly points = input<DataPoint[] | null>(null);

  /** The limits of the variable, or null when it has none. */
  readonly thresholds = input<OverviewEnvironmentalThreshold | null>(null);

  /**
   * Computes the list of events to display.
   *
   * @returns The pre-filtered points if provided; otherwise, filters the trend's
   * data points to include only 'CRITICAL' and 'WARNING' states.
   */
  protected readonly criticalEvents = computed(() => {
    // If parent passes filtered points, use them directly.
    if (this.points() !== null) return this.points()!;

    // Fallback: show only deviations (Warning & Critical) directly from the trend.
    return this.trend().dataPoints.filter(
      (p) => p.state === 'CRITICAL' || p.state === 'WARNING',
    );
  });

  /**
   * Limit a reading went past, from the profile of the device: the platform does not keep it with the readings.
   *
   * @param point - The reading
   * @returns The limit, or null when the variable has no limits
   */
  protected limitOf(point: DataPoint): number | null {
    return crossedLimit(point, this.thresholds());
  }
}
