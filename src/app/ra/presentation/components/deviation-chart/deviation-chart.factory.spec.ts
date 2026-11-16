import { TranslateService } from '@ngx-translate/core';
import { DeviationTrend } from '../../../domain/model/deviation-trend.entity';
import { DeviationChartFactory } from './deviation-chart.factory';

const translate = {
  instant: (key: string, params?: Record<string, unknown>) => `${key} ${JSON.stringify(params ?? {})}`,
  currentLang: () => 'en',
} as unknown as TranslateService;

const bothSides = { normalMin: 2, normalMax: 8, criticalMin: 0, criticalMax: 12 };
const upperOnly = { normalMin: null, normalMax: 800, criticalMin: null, criticalMax: 1000 };

const trend = new DeviationTrend({
  id: null,
  parameterName: 'TEMPERATURE',
  equipmentId: 12,
  unit: '°C',
  trendDirection: 'STABLE',
  dataPoints: [
    { timestamp: '2026-11-01T10:00:00Z', recordedValue: -1, upperThreshold: 12, lowerThreshold: 0, state: 'CRITICAL' },
    { timestamp: '2026-11-01T11:00:00Z', recordedValue: 1, upperThreshold: 8, lowerThreshold: 2, state: 'WARNING' },
    { timestamp: '2026-11-01T12:00:00Z', recordedValue: 13, upperThreshold: 12, lowerThreshold: 0, state: 'CRITICAL' },
    { timestamp: '2026-11-01T13:00:00Z', recordedValue: 5, upperThreshold: 8, lowerThreshold: 2, state: 'NORMAL' },
  ],
});

/** What the tooltip adds to a reading of the trend. */
function footerOf(index: number, thresholds: typeof bothSides | null): unknown {
  const options = DeviationChartFactory.createChartOptions(trend, thresholds, translate);
  const footer = options.plugins!.tooltip!.callbacks!.footer as unknown as (items: { dataIndex: number }[]) => unknown;
  return footer([{ dataIndex: index }]);
}

describe('DeviationChartFactory', () => {
  it('draws nothing when the variable has no limits, instead of inventing them', () => {
    expect(DeviationChartFactory.createAnnotations(null, '°C', translate)).toEqual({});
  });

  it('lets the axis follow readings below zero', () => {
    const y = DeviationChartFactory.createChartOptions(trend, null, translate).scales!['y']!;
    expect(y.min).toBeUndefined();
  });

  it('draws both sides of the range', () => {
    const annotations = DeviationChartFactory.createAnnotations(bothSides, '°C', translate) as Record<string, { yMin?: number; yMax?: number; type: string }>;
    const zones = Object.values(annotations).filter((annotation) => annotation.type === 'box');
    const lines = Object.values(annotations).filter((annotation) => annotation.type === 'line');
    expect(zones.map(({ yMin, yMax }) => [yMin, yMax])).toEqual([
      [undefined, 0],
      [0, 2],
      [2, 8],
      [8, 12],
      [12, undefined],
    ]);
    expect(lines.map(({ yMin }) => yMin)).toEqual([0, 2, 8, 12]);
  });

  it('only draws the side that is configured', () => {
    const annotations = DeviationChartFactory.createAnnotations(upperOnly, 'ppm', translate) as Record<string, { yMin?: number; yMax?: number; type: string }>;
    const zones = Object.values(annotations).filter((annotation) => annotation.type === 'box');
    expect(zones.map(({ yMin, yMax }) => [yMin, yMax])).toEqual([
      [undefined, 800],
      [800, 1000],
      [1000, undefined],
    ]);
  });

  it('names the limits of the legend as the platform evaluates them', () => {
    expect(DeviationChartFactory.createLegend(bothSides, '°C').map(({ key, params }) => [key, params])).toEqual([
      ['reporting.deviations.legend-critical-below', { limit: 0, unit: '°C' }],
      ['reporting.deviations.legend-warning', { min: 0, max: 2, unit: '°C' }],
      ['reporting.deviations.legend-normal', { min: 2, max: 8, unit: '°C' }],
      ['reporting.deviations.legend-warning', { min: 8, max: 12, unit: '°C' }],
      ['reporting.deviations.legend-critical', { limit: 12, unit: '°C' }],
    ]);
    expect(DeviationChartFactory.createLegend(upperOnly, 'ppm')[0]).toMatchObject({
      key: 'reporting.deviations.legend-normal-up-to',
      params: { max: 800, unit: 'ppm' },
    });
  });

  it('tells the limit each reading crossed', () => {
    expect(footerOf(0, bothSides)).toBe('reporting.deviations.tooltip-critical {"limit":0,"unit":"°C"}');
    expect(footerOf(1, bothSides)).toBe('reporting.deviations.tooltip-warning {"limit":2,"unit":"°C"}');
    expect(footerOf(2, bothSides)).toBe('reporting.deviations.tooltip-critical {"limit":12,"unit":"°C"}');
    expect(footerOf(3, bothSides)).toBe('');
  });

  it('only tells the condition of a reading when the limits are unknown', () => {
    expect(footerOf(0, null)).toBe('tracking.states.CRITICAL {}');
  });
});
