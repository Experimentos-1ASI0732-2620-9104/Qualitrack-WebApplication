import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { MetricDefinition, MonitoredMetric } from '../../../domain/model/monitored-metric';
import { EnvironmentalThreshold, ThresholdInput } from '../../../domain/model/environmental-profile.entity';

/**
 * Represents an editable threshold configuration row in the UI.
 *
 * This structure combines metric metadata with the temporary values
 * entered by the user before submitting the configuration.
 */
interface ThresholdRow {
  definition: MetricDefinition;
  enabled: boolean;
  normalMin: number | null;
  normalMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
}

/**
 * Component responsible for configuring environmental thresholds
 * for IoT monitoring metrics.
 *
 * This component allows quality managers to define the limits used
 * by the platform to classify measurements into:
 * - NORMAL.
 * - WARNING.
 * - CRITICAL.
 *
 * The component manages:
 * - Available metric configurations.
 * - Current threshold values.
 * - User input validation.
 * - Submission of updated threshold configurations.
 *
 * Threshold rules must follow the same validation logic applied
 * by the platform to ensure consistent environmental evaluation.
 */
@Component({
  selector: 'app-threshold-editor',
  standalone: true,
  imports: [FormsModule, TranslateModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './threshold-editor.html',
  styleUrls: [
    '../../../../shared/presentation/styles/operations-page.css',
    '../../views/tracking-views.css',
  ],
})
export class ThresholdEditor {
  readonly metrics = input.required<MetricDefinition[]>();
  readonly thresholds = input<EnvironmentalThreshold[]>([]);
  readonly readonly = input(false);
  readonly saving = input(false);
  readonly save = output<ThresholdInput[]>();

  protected readonly rows = signal<ThresholdRow[]>([]);
  protected readonly error = signal<string | null>(null);

  /**
   * Synchronizes editable threshold rows whenever the input metrics
   * or saved configurations change.
   *
   * Existing thresholds are mapped to their corresponding metric definitions,
   * while new metrics are initialized without limits.
   */
  constructor() {
    effect(() => {
      const saved = this.thresholds();
      this.rows.set(
        this.metrics().map((definition) => {
          const threshold = saved.find((item) => item.metric === definition.metric);
          return {
            definition,
            enabled: !!threshold,
            normalMin: threshold?.normalMin ?? null,
            normalMax: threshold?.normalMax ?? null,
            criticalMin: threshold?.criticalMin ?? null,
            criticalMax: threshold?.criticalMax ?? null,
          };
        }),
      );
      this.error.set(null);
    });
  }

  /**
   * Validates and submits the configured environmental thresholds.
   *
   * The method ensures that:
   * - Enabled metrics contain valid limits.
   * - Threshold ranges follow business rules.
   * - Critical and normal boundaries are consistent.
   *
   * When validation succeeds, the component emits the configuration
   * to the parent component for persistence.
   */
  protected submit(): void {
    const thresholds: ThresholdInput[] = [];
    for (const row of this.rows().filter((item) => item.enabled)) {
      const problem = validate(row);
      if (problem) {
        this.error.set(problem);
        return;
      }
      thresholds.push({
        metric: row.definition.metric as MonitoredMetric,
        normalMin: number(row.normalMin),
        normalMax: number(row.normalMax),
        criticalMin: number(row.criticalMin),
        criticalMax: number(row.criticalMax),
      });
    }
    this.error.set(null);
    this.save.emit(thresholds);
  }
}

/**
 * Converts a form value into a numeric threshold value.
 *
 * Empty values are converted into null because they represent
 * non-configured limits.
 *
 * @param value Input value from the threshold form.
 * @returns Numeric value or null when empty.
 */
function number(value: number | null | string): number | null {
  return value === null || value === '' ? null : Number(value);
}

/**
 * Validates threshold configuration according to platform business rules.
 *
 * Validation ensures:
 * - Both normal and critical boundaries are configured consistently.
 * - At least one limit exists.
 * - Critical limits remain outside the normal operating range.
 * - Normal ranges are logically ordered.
 *
 * @param row Threshold configuration row.
 * @returns Translation key describing the validation error,
 * or null when the configuration is valid.
 */
function validate(row: ThresholdRow): string | null {
  const [normalMin, normalMax, criticalMin, criticalMax] =
    [row.normalMin, row.normalMax, row.criticalMin, row.criticalMax].map(number);
  if ((normalMin === null) !== (criticalMin === null) || (normalMax === null) !== (criticalMax === null)) {
    return 'tracking.profiles.errors.incomplete';
  }
  if (normalMin === null && normalMax === null) return 'tracking.profiles.errors.no-limits';
  if (normalMin !== null && criticalMin !== null && criticalMin >= normalMin) return 'tracking.profiles.errors.critical-min';
  if (normalMax !== null && criticalMax !== null && criticalMax <= normalMax) return 'tracking.profiles.errors.critical-max';
  if (normalMin !== null && normalMax !== null && normalMin >= normalMax) return 'tracking.profiles.errors.normal-range';
  return null;
}
