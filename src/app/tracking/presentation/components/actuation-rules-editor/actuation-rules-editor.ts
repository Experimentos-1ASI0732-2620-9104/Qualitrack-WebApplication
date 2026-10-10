import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ActuationRule } from '../../../domain/model/environmental-profile.entity';
import { ACTIVATIONS, ActuationAction } from '../../../domain/model/actuation-event.entity';
import { MonitoredMetric } from '../../../domain/model/monitored-metric';

interface RuleRow {
  metric: MonitoredMetric | '';
  state: 'WARNING' | 'CRITICAL';
  action: ActuationAction | '';
}

/**
 * Relates a WARNING or CRITICAL condition of a metric of the container with the ventilation, the simulated
 * refrigeration or the servo (US59). Only metrics with a saved threshold can be used.
 */
@Component({
  selector: 'app-actuation-rules-editor',
  standalone: true,
  imports: [FormsModule, TranslateModule, MatButtonModule, MatIconModule],
  templateUrl: './actuation-rules-editor.html',
  styleUrls: [
    '../../../../shared/presentation/styles/operations-page.css',
    '../../views/tracking-views.css',
  ],
})
export class ActuationRulesEditor {
  /**
   * Available metrics that have threshold configuration enabled.
   *
   * Only these metrics can be associated with actuation rules.
   */
  readonly metrics = input.required<MonitoredMetric[]>();

  /**
   * Existing actuation rules loaded from the environmental profile.
   */
  readonly rules = input<ActuationRule[]>([]);

  /**
   * Determines whether the component is displayed in read-only mode.
   */
  readonly readonly = input(false);

  /**
   * Indicates whether a save operation is currently running.
   */
  readonly saving = input(false);

  /**
   * Emits validated actuation rules to the parent component.
   */
  readonly save = output<ActuationRule[]>();

  /**
   * Available actuator operations that can be triggered automatically.
   */
  protected readonly actions = ACTIVATIONS;

  /**
   * Supported environmental states that can trigger automation.
   */
  protected readonly states: ('WARNING' | 'CRITICAL')[] = ['WARNING', 'CRITICAL'];

  /**
   * Reactive collection of editable rule rows.
   *
   * This state represents the current form values before persistence.
   */
  protected readonly rows = signal<RuleRow[]>([]);

  /**
   * Validation error message displayed in the interface.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Synchronizes local editable rows whenever input rules change.
   *
   * The effect ensures that the component reflects the latest
   * environmental profile configuration provided by the parent.
   */
  constructor() {
    effect(() => {
      this.rows.set(this.rules().map((rule) => ({ ...rule })));
      this.error.set(null);
    });
  }

  /**
   * Adds a new empty actuation rule row.
   *
   * The new rule starts with the first available metric,
   * a WARNING condition and no selected action.
   */
  protected add(): void {
    this.rows.update((rows) => [
      ...rows,
      { metric: this.metrics()[0] ?? '', state: 'WARNING', action: '' },
    ]);
  }

  /**
   * Removes an actuation rule from the editable collection.
   *
   * @param index Position of the rule to remove.
   */
  protected remove(index: number): void {
    this.rows.update((rows) => rows.filter((_, position) => position !== index));
  }

  /**
   * Validates and submits the configured actuation rules.
   *
   * Validation rules:
   * - Every rule must have a metric and an action.
   * - Only metrics with configured thresholds are allowed.
   * - Duplicate rule combinations are not permitted.
   *
   * When validation succeeds, the component emits the final
   * configuration to the parent component.
   */
  protected submit(): void {
    const rows = this.rows();
    if (rows.some((row) => !row.metric || !row.action)) {
      this.error.set('tracking.profiles.errors.incomplete-rule');
      return;
    }
    if (rows.some((row) => !this.metrics().includes(row.metric as MonitoredMetric))) {
      this.error.set('tracking.profiles.errors.rule-without-threshold');
      return;
    }
    const keys = rows.map((row) => `${row.metric}|${row.state}|${row.action}`);
    if (new Set(keys).size !== keys.length) {
      this.error.set('tracking.profiles.errors.repeated-rule');
      return;
    }
    this.error.set(null);
    this.save.emit(
      rows.map((row) => ({
        metric: row.metric as MonitoredMetric,
        state: row.state,
        action: row.action as ActuationAction,
      })),
    );
  }
}
