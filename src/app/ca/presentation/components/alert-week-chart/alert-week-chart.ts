import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { map } from 'rxjs';

import { formatDate } from '../../../../shared/presentation/utils/date-time-format';
import { AlertWeek } from '../../../domain/model/alert-history-weeks';
import { AlertSeverity } from '../../../domain/model/deviation-alert.entity';
import { ALERT_SEVERITY_CHIPS } from '../../alert-chips';

/** Tokens of the style guide that paint each severity, the same as its chip. */
const SEVERITY_COLORS: Readonly<Record<AlertSeverity, { fill: string; border: string }>> = {
  CRITICAL: { fill: '--qt-error', border: '--qt-error-text' },
  WARNING: { fill: '--qt-warning', border: '--qt-warning-text' },
  LOW: { fill: '--qt-text-muted', border: '--qt-neutral-text' },
};

/**
 * Weekly trend of the alert history: one bar per week, stacked by severity.
 *
 * @remarks
 * The Y axis starts at zero and the colors are the ones of the severity chips. A table with the same numbers is read
 * by screen readers instead of the canvas.
 */
@Component({
  selector: 'app-alert-week-chart',
  standalone: true,
  imports: [BaseChartDirective, TranslatePipe],
  templateUrl: './alert-week-chart.html',
  styleUrl: './alert-week-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertWeekChart {
  private readonly translate = inject(TranslateService);
  private readonly style = getComputedStyle(inject(DOCUMENT).documentElement);

  /** Weeks of the period, from the oldest. */
  readonly weeks = input.required<readonly AlertWeek[]>();

  /** Severities from the bottom of the bar to the top. */
  protected readonly severities: readonly AlertSeverity[] = ['CRITICAL', 'WARNING', 'LOW'];

  /** Chip of each severity, for its name. */
  protected readonly severityChips = ALERT_SEVERITY_CHIPS;

  /** Language of the application, so the days and the names follow it. */
  private readonly language = toSignal(
    this.translate.onLangChange.pipe(map((change) => change.lang)),
    { initialValue: this.translate.getCurrentLang() || 'en' },
  );

  /** Name of each severity, read again when the translations load or the language changes. */
  private readonly names = toSignal(
    this.translate.stream(
      this.severities.map((severity) => ALERT_SEVERITY_CHIPS[severity].labelKey),
    ),
    { initialValue: {} as Record<string, string> },
  );

  /** First day of each week, as the person reads it. */
  protected readonly days = computed(() =>
    this.weeks().map((week) => formatDate(week.start, this.language())),
  );

  /** Bars of the chart. */
  protected readonly data = computed<ChartData<'bar'>>(() => ({
    labels: this.days(),
    datasets: this.severities.map((severity) => ({
      label: this.names()[ALERT_SEVERITY_CHIPS[severity].labelKey] ?? severity,
      data: this.weeks().map((week) => week.bySeverity[severity]),
      backgroundColor: this.token(SEVERITY_COLORS[severity].fill),
      borderColor: this.token(SEVERITY_COLORS[severity].border),
      borderWidth: 1,
    })),
  }));

  /** Stacked bars, with whole numbers on a Y axis that starts at zero. */
  protected readonly options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  /**
   * Value of a token of the style guide, because the canvas cannot read CSS variables.
   *
   * @param name - The token, for example `--qt-error`
   * @returns Its color
   */
  private token(name: string): string {
    return this.style.getPropertyValue(name).trim();
  }
}
