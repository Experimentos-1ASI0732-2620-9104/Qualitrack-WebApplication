import { ChartData, ChartOptions } from 'chart.js';
import { AnnotationOptions } from 'chartjs-plugin-annotation';
import { TranslateService } from '@ngx-translate/core';
import { DataPoint, DeviationTrend, ReadingState } from '../../../domain/model/deviation-trend.entity';
import { OverviewEnvironmentalThreshold } from '../../../domain/model/overview-environmental-profile.entity';
import { formatDateTime } from '../../../../shared/presentation/utils/date-time-format';
import { LABORATORY_TIME_ZONE } from '../../../../shared/presentation/utils/local-date';

/** Limits of a variable; each side of the range is either complete or not configured. */
type ChartThresholds = Pick<OverviewEnvironmentalThreshold, 'normalMin' | 'normalMax' | 'criticalMin' | 'criticalMax'>;

/** Stretch of values with the same condition; an open end has no limit. */
interface ThresholdBand {
  state: ReadingState;
  from: number | null;
  to: number | null;
}

/** Entry of the legend of the chart, with what its text needs. */
export interface LegendEntry {
  /** Style class of the mark of the condition. */
  marker: string;
  key: string;
  params: Record<string, unknown>;
}

const ZONE_COLORS: Record<ReadingState, string> = {
  NORMAL: 'rgba(16, 185, 129, 0.08)',
  WARNING: 'rgba(245, 158, 11, 0.08)',
  CRITICAL: 'rgba(239, 68, 68, 0.05)',
};
const LINE_COLORS: Record<ReadingState, string> = { NORMAL: '#10b981', WARNING: '#f59e0b', CRITICAL: '#ef4444' };
const LINE_LABEL_COLORS: Record<ReadingState, string> = { NORMAL: '#047857', WARNING: '#b45309', CRITICAL: '#ef4444' };
const MARKERS: Record<ReadingState, string> = {
  NORMAL: 'box-legend normal-bg',
  WARNING: 'triangle-warning',
  CRITICAL: 'critical-dot',
};

/**
 * Splits the values of a variable by condition, from the lowest to the highest.
 *
 * @remarks
 * It follows how the platform evaluates a reading: below `criticalMin` or above `criticalMax` it is CRITICAL, outside
 * the normal range it is WARNING and otherwise NORMAL.
 *
 * @param thresholds - The limits configured for the variable
 * @returns The stretches of values
 */
function bandsOf({ normalMin, normalMax, criticalMin, criticalMax }: ChartThresholds): ThresholdBand[] {
  const bands: ThresholdBand[] = [];
  if (criticalMin != null && normalMin != null) {
    bands.push({ state: 'CRITICAL', from: null, to: criticalMin }, { state: 'WARNING', from: criticalMin, to: normalMin });
  }
  bands.push({ state: 'NORMAL', from: normalMin ?? null, to: normalMax ?? null });
  if (normalMax != null && criticalMax != null) {
    bands.push({ state: 'WARNING', from: normalMax, to: criticalMax }, { state: 'CRITICAL', from: criticalMax, to: null });
  }
  return bands;
}

/** Text of a stretch of values, as a translation key and its values. */
function bandText({ state, from, to }: ThresholdBand, unit: string): Pick<LegendEntry, 'key' | 'params'> {
  if (state === 'WARNING') return { key: 'reporting.deviations.legend-warning', params: { min: from, max: to, unit } };
  if (state === 'CRITICAL') {
    return to === null
      ? { key: 'reporting.deviations.legend-critical', params: { limit: from, unit } }
      : { key: 'reporting.deviations.legend-critical-below', params: { limit: to, unit } };
  }
  if (from !== null && to !== null) return { key: 'reporting.deviations.legend-normal', params: { min: from, max: to, unit } };
  return to !== null
    ? { key: 'reporting.deviations.legend-normal-up-to', params: { max: to, unit } }
    : { key: 'reporting.deviations.legend-normal-from', params: { min: from, unit } };
}

/**
 * Limit a reading crossed, the one its condition depends on.
 *
 * @param point - The reading
 * @param thresholds - The limits configured for the variable, or null when there are none
 * @returns The limit, or null when it is not known
 */
export function crossedLimit(point: DataPoint, thresholds: ChartThresholds | null): number | null {
  if (!thresholds) return null;
  const critical = point.state === 'CRITICAL';
  const lower = critical ? thresholds.criticalMin : thresholds.normalMin;
  const upper = critical ? thresholds.criticalMax : thresholds.normalMax;
  return lower != null && point.recordedValue < lower ? lower : (upper ?? null);
}

/**
 * Factory class responsible for generating Chart.js configuration objects.
 *
 * @remarks
 * This separates the complex visual configuration (colors, tooltips, annotations)
 * from the component logic, keeping the component focused on state management.
 */
export class DeviationChartFactory {
  /**
   * Builds the Chart.js data object from a deviation trend.
   *
   * @param trend - The deviation trend containing the data points to plot.
   * @returns A ChartData object formatted for a line chart.
   */
  static createChartData(trend: DeviationTrend | null): ChartData<'line'> {
    if (!trend) return { datasets: [] };

    return {
      datasets: [
        {
          label: trend.parameterName,
          data: trend.dataPoints.map((point) => ({ x: Date.parse(point.timestamp), y: point.recordedValue })),
          borderColor: '#0f766e',
          borderWidth: 2,
          tension: 0.4,
          // Only show points for WARNING or CRITICAL states to keep normal data clean.
          pointRadius: (ctx) => {
            const point = trend.dataPoints[ctx.dataIndex];
            return point?.state === 'CRITICAL' || point?.state === 'WARNING' ? 6 : 0;
          },
          pointBackgroundColor: (ctx) => {
            const point = trend.dataPoints[ctx.dataIndex];
            return point?.state === 'CRITICAL' ? '#ef4444' : '#f59e0b';
          },
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          fill: false,
        },
      ],
    };
  }

  /**
   * Builds the legend of the conditions of a variable.
   *
   * @param thresholds - The limits configured for the variable
   * @param unit - The unit of the variable
   * @returns One entry per stretch of values
   */
  static createLegend(thresholds: ChartThresholds, unit: string): LegendEntry[] {
    return bandsOf(thresholds).map((band) => ({ marker: MARKERS[band.state], ...bandText(band, unit) }));
  }

  /**
   * Builds the zones and the lines of the limits of a variable.
   *
   * @param thresholds - The limits configured for the variable, or null when it has none: nothing is drawn then,
   * because a limit that does not exist cannot be shown
   * @param unit - The unit of the variable
   * @param translate - The translation service to localize the labels
   * @returns The annotations of the chart
   */
  static createAnnotations(
    thresholds: ChartThresholds | null,
    unit: string,
    translate: TranslateService,
  ): Record<string, AnnotationOptions> {
    const annotations: Record<string, AnnotationOptions> = {};
    if (!thresholds) return annotations;

    bandsOf(thresholds).forEach((band, index) => {
      annotations[`zone${index}`] = {
        type: 'box',
        ...(band.from !== null && { yMin: band.from }),
        ...(band.to !== null && { yMax: band.to }),
        backgroundColor: ZONE_COLORS[band.state],
        borderWidth: 0,
      };

      // Each limit has one line, labelled with the stretch it starts; the lowest stretch has the limit that ends it.
      const lowest = band.from === null && band.state === 'CRITICAL';
      const limit = lowest ? band.to : band.from;
      const belowNormal = band.state === 'WARNING' && band.to === thresholds.normalMin;
      if (limit === null || belowNormal) return;
      const { key, params } = bandText(band, unit);
      annotations[`line${index}`] = {
        type: 'line',
        yMin: limit,
        yMax: limit,
        borderColor: LINE_COLORS[band.state],
        borderWidth: 1.5,
        borderDash: [5, 5],
        label: {
          display: true,
          content: translate.instant(key, params),
          position: 'start',
          backgroundColor: 'transparent',
          color: LINE_LABEL_COLORS[band.state],
          font: { size: 11, weight: 'bold' },
          yAdjust: lowest ? 10 : -10,
          xAdjust: 10,
        },
      };
    });
    return annotations;
  }

  /**
   * Builds the Chart.js options object, including scales, tooltips, and threshold annotations.
   *
   * @param trend - The current deviation trend (used for tooltip callbacks).
   * @param thresholds - The limits configured for the variable, or null when it has none.
   * @param translate - The translation service to localize labels and tooltips.
   * @returns A ChartOptions object configured for the deviation line chart.
   */
  static createChartOptions(
    trend: DeviationTrend | null,
    thresholds: ChartThresholds | null,
    translate: TranslateService,
  ): ChartOptions<'line'> {
    const unit = trend?.unit ?? '';

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'normal' },
          titleColor: '#cbd5e1',
          bodyFont: { size: 20, weight: 'bold' },
          bodyColor: '#ffffff',
          footerFont: { size: 12, weight: 'normal' },
          footerColor: '#cbd5e1',
          padding: 12,
          displayColors: false,
          cornerRadius: 8,
          callbacks: {
            // Formats the X-axis timestamp based on the active language.
            title: (items) => {
              const value = items[0].parsed.x ?? 0;
              return formatDateTime(new Date(value), translate.currentLang() || 'en');
            },
            label: (item) => `${item.parsed.y} ${unit}`,
            // Tells the state (Warning/Critical) of the reading and the limit it crossed.
            footer: (items) => {
              const point = trend?.dataPoints[items[0].dataIndex];
              if (point?.state !== 'CRITICAL' && point?.state !== 'WARNING') return '';
              const limit = crossedLimit(point, thresholds);
              if (limit === null) return translate.instant(`tracking.states.${point.state}`);
              return translate.instant(`reporting.deviations.tooltip-${point.state.toLowerCase()}`, { limit, unit });
            },
          },
        },
        // Chart.js Annotation plugin configuration for background zones and threshold lines.
        annotation: { annotations: DeviationChartFactory.createAnnotations(thresholds, unit, translate) },
      },
      scales: {
        x: {
          type: 'linear',
          grid: { display: false },
          border: { display: true, color: '#e2e8f0' },
          ticks: {
            maxTicksLimit: 6, maxRotation: 0,
            // Formats X-axis ticks (e.g., "Oct 5") based on language.
            callback: (value) => {
              const locale = translate.currentLang()?.startsWith('es') ? 'es-PE' : 'en-US';
              return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: LABORATORY_TIME_ZONE }).format(new Date(Number(value)));
            },
            font: { size: 12 }, color: '#64748b', padding: 10,
          },
        },
        // The axis follows the readings and the limits, which can be below zero as in a freezer.
        y: {
          grace: '5%',
          title: { display: true, text: unit, color: '#64748b', font: { size: 12 }, padding: { bottom: 10 } },
          grid: { display: false },
          border: { display: true, color: '#e2e8f0' },
          ticks: { color: '#64748b', font: { size: 12 }, padding: 10 },
        },
      },
    };
  }
}
