import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { MetricDefinition, MonitoredMetric } from '../../../domain/model/monitored-metric';
import {
  EnvironmentalThreshold,
  ThresholdInput,
} from '../../../domain/model/environmental-profile.entity';

/**
 * Represents an editable threshold configuration row in the UI.
 *
 * This structure combines metric metadata with the temporary values
 * entered by the user before submitting the configuration.
 */
export interface ThresholdRow {
  definition: MetricDefinition;
  enabled: boolean;
  normalMin: number | null;
  normalMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
}

/**
 * Problem found in a threshold row: the translation key of its message and the values the message shows.
 */
export interface ThresholdProblem {
  key: string;
  params?: Record<string, string | number>;
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
  imports: [FormsModule, TranslatePipe, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './threshold-editor.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './threshold-editor.css',
})
export class ThresholdEditor {
  private readonly translate = inject(TranslateService);
  protected readonly fieldMin = (definition: MetricDefinition) => definition.range?.min;
  protected readonly fieldMax = (definition: MetricDefinition) => definition.range?.max;

  readonly metrics = input.required<MetricDefinition[]>();
  readonly thresholds = input<EnvironmentalThreshold[]>([]);
  readonly readonly = input(false);
  readonly saving = input(false);
  readonly save = output<ThresholdInput[]>();

  protected readonly rows = signal<ThresholdRow[]>([]);
  protected readonly error = signal<ThresholdProblem | null>(null);

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
        const metric = problem.params?.['metric'];
        this.error.set(
          metric === undefined
            ? problem
            : {
                ...problem,
                params: {
                  ...problem.params,
                  metric: this.translate.instant(`tracking.metrics.${metric}`),
                },
              },
        );
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
 * - Every limit is a finite number inside the plausible range of the metric.
 * - Both normal and critical boundaries are configured consistently.
 * - At least one limit exists.
 * - Critical limits remain outside the normal operating range.
 * - Normal ranges are logically ordered.
 *
 * @param row Threshold configuration row.
 * @returns The problem found, with its translation key and the values it shows, or null when the configuration is valid.
 */
export function validate(row: ThresholdRow): ThresholdProblem | null {
  const values = [row.normalMin, row.normalMax, row.criticalMin, row.criticalMax].map(number);
  const [normalMin, normalMax, criticalMin, criticalMax] = values;
  const range = row.definition.range;
  if (
    values.some(
      (value) =>
        value !== null &&
        (!Number.isFinite(value) || (range && (value < range.min || value > range.max))),
    )
  ) {
    return {
      key: 'tracking.profiles.errors.out-of-range',
      params: {
        metric: row.definition.metric,
        min: range?.min ?? '',
        max: range?.max ?? '',
        unit: row.definition.unit,
      },
    };
  }
  if (
    (normalMin === null) !== (criticalMin === null) ||
    (normalMax === null) !== (criticalMax === null)
  ) {
    return { key: 'tracking.profiles.errors.incomplete' };
  }
  if (normalMin === null && normalMax === null)
    return { key: 'tracking.profiles.errors.no-limits' };
  if (normalMin !== null && criticalMin !== null && criticalMin >= normalMin)
    return { key: 'tracking.profiles.errors.critical-min' };
  if (normalMax !== null && criticalMax !== null && criticalMax <= normalMax)
    return { key: 'tracking.profiles.errors.critical-max' };
  if (normalMin !== null && normalMax !== null && normalMin >= normalMax)
    return { key: 'tracking.profiles.errors.normal-range' };
  return null;
}
