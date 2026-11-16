import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatCard, MatCardContent, MatCardFooter, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { OverviewEnvironmentalProfile } from '../../../domain/model/overview-environmental-profile.entity';
import { MeasurementSummary } from '../../../domain/model/kpi-dashboard.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';

/** Possible visual states for a KPI summary card based on threshold evaluation. */
export type SummaryState = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNCONFIGURED';

/**
 * Component that renders the individual KPI cards for environmental readings.
 *
 * @remarks
 * It evaluates the minimum and the maximum of the readings against the configured thresholds
 * (either from the environment or the specific container monitor) to color-code
 * the cards with the worst state of the period, because a good average can hide critical readings.
 */
@Component({
  selector: 'app-kpi-summary-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, DecimalPipe, DateTimePipe, TranslatePipe,
    MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardFooter],
  styleUrl: './kpi-summary-cards.css',
  templateUrl: './kpi-summary-cards.html',
})
export class KpiSummaryCards {
  /** The raw measurement summaries returned by the API. */
  readonly summaries = input.required<MeasurementSummary[]>();

  /** Resolves the display name of a device, or null when it is unknown. */
  readonly deviceNameFn = input.required<(id: number) => string | null>();

  /** Environmental profiles (thresholds) mapped by device ID to evaluate the states. */
  readonly profiles = input<Record<number, OverviewEnvironmentalProfile | null>>({});

  /**
   * Determines the visual state of a KPI summary card.
   *
   * @remarks
   * The minimum and the maximum are compared with the real thresholds of the device profile (environment or
   * container), as the platform evaluates a reading; it is `UNCONFIGURED` if there are no thresholds (e.g., RFID_TAG,
   * MOTION) or invalid data.
   *
   * @param summary - The measurement summary containing the range of the readings and device ID.
   * @returns The worst state of the period (`NORMAL`, `WARNING`, `CRITICAL`, or `UNCONFIGURED`).
   */
  protected stateOf(summary: MeasurementSummary): SummaryState {
    const profile = this.profiles()[summary.deviceId];
    const threshold = profile?.threshold(summary.metric);

    if (!threshold) return 'UNCONFIGURED';

    const minimum = Number(summary.minimum);
    const maximum = Number(summary.maximum);
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return 'UNCONFIGURED';

    const { normalMin, normalMax, criticalMin, criticalMax } = threshold;
    if (criticalMin != null && minimum < criticalMin) return 'CRITICAL';
    if (criticalMax != null && maximum > criticalMax) return 'CRITICAL';
    if (normalMin != null && minimum < normalMin) return 'WARNING';
    if (normalMax != null && maximum > normalMax) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Resolves the Material icon name corresponding to a visual state.
   *
   * @param state - The evaluated state.
   * @returns The name of the Material icon to render.
   */
  protected statusIcon(state: SummaryState): string {
    switch (state) {
      case 'CRITICAL': return 'error';
      case 'WARNING': return 'warning';
      case 'NORMAL': return 'check_circle';
      default: return 'remove_circle_outline';
    }
  }

  /**
   * Resolves the translation key for the state label.
   *
   * @param state - The evaluated state.
   * @returns The translation key for the state text.
   */
  protected statusLabelKey(state: SummaryState): string {
    switch (state) {
      case 'CRITICAL': return 'reporting.summary.state-critical';
      case 'WARNING': return 'reporting.summary.state-warning';
      case 'NORMAL': return 'reporting.summary.state-normal';
      default: return 'reporting.summary.state-unconfigured';
    }
  }

  /**
   * Calculates the exact percentage position of the average value within the min/max range.
   *
   * @remarks
   * Used to position the dot on the horizontal range bar. It ensures the value
   * stays within 0% and 100%, preventing visual overflow.
   *
   * @param summary - The measurement summary containing min, max, and average.
   * @returns A number between 0 and 100 representing the percentage position.
   */
  protected dotPosition(summary: MeasurementSummary): number {
    const min = Number(summary.minimum);
    const max = Number(summary.maximum);
    const avg = Number(summary.average);

    // If values are invalid or the range is zero, we place the dot in the center.
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 50;

    // Calculate percentage and clamp it between 0 and 100 to prevent CSS overflow.
    return Math.min(100, Math.max(0, ((avg - min) / (max - min)) * 100));
  }
}
