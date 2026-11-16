import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { METRICS, metricDefinition } from '../../../domain/model/monitored-metric';
import { ThresholdEditor, ThresholdRow, validate } from './threshold-editor';

function row(metric: string, limits: Partial<Omit<ThresholdRow, 'definition' | 'enabled'>>): ThresholdRow {
  return {
    definition: metricDefinition(metric)!,
    enabled: true,
    normalMin: null,
    normalMax: null,
    criticalMin: null,
    criticalMax: null,
    ...limits,
  };
}

describe('validate', () => {
  it('accepts a coherent temperature range', () => {
    expect(validate(row('TEMPERATURE', { criticalMin: 0, normalMin: 2, normalMax: 8, criticalMax: 10 }))).toBeNull();
  });

  it('accepts negative temperatures down to -100 and an upper-only air quality limit', () => {
    expect(validate(row('TEMPERATURE', { criticalMin: -90, normalMin: -80, normalMax: -60, criticalMax: -50 }))).toBeNull();
    expect(validate(row('AIR_QUALITY', { normalMax: 1000, criticalMax: 2000 }))).toBeNull();
  });

  it.each([
    ['TEMPERATURE', { criticalMin: -101, normalMin: 2, normalMax: 8, criticalMax: 10 }],
    ['TEMPERATURE', { criticalMin: 0, normalMin: 2, normalMax: 8, criticalMax: 151 }],
    ['HUMIDITY', { criticalMin: 10, normalMin: 20, normalMax: 60, criticalMax: 101 }],
    ['HUMIDITY', { criticalMin: -1, normalMin: 20, normalMax: 60, criticalMax: 80 }],
    ['LUMINOSITY', { normalMin: 10, criticalMin: 5, normalMax: 500, criticalMax: 100001 }],
    ['AIR_QUALITY', { normalMax: 1000, criticalMax: 10001 }],
  ])('rejects %s limits outside its physical range', (metric, limits) => {
    const problem = validate(row(metric, limits));
    expect(problem?.key).toBe('tracking.profiles.errors.out-of-range');
    expect(problem?.params).toEqual(expect.objectContaining({ metric }));
  });

  it('rejects a value that is not finite', () => {
    expect(validate(row('TEMPERATURE', { normalMin: Infinity, criticalMin: 0 }))?.key).toBe(
      'tracking.profiles.errors.out-of-range',
    );
  });

  it('keeps the existing consistency rules', () => {
    expect(validate(row('TEMPERATURE', { normalMin: 2 }))?.key).toBe('tracking.profiles.errors.incomplete');
    expect(validate(row('TEMPERATURE', {}))?.key).toBe('tracking.profiles.errors.no-limits');
    expect(validate(row('TEMPERATURE', { criticalMin: 3, normalMin: 2 }))?.key).toBe('tracking.profiles.errors.critical-min');
    expect(validate(row('TEMPERATURE', { normalMax: 8, criticalMax: 7 }))?.key).toBe('tracking.profiles.errors.critical-max');
    expect(validate(row('TEMPERATURE', { criticalMin: 0, normalMin: 9, normalMax: 8, criticalMax: 10 }))?.key).toBe(
      'tracking.profiles.errors.normal-range',
    );
  });
});

describe('metric ranges', () => {
  it('defines a range for every metric with thresholds and for no other', () => {
    for (const metric of METRICS) {
      expect(!!metric.range).toBe(metric.configurable);
    }
  });
});

describe('ThresholdEditor', () => {
  function create() {
    TestBed.configureTestingModule({ imports: [ThresholdEditor], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(ThresholdEditor);
    fixture.componentRef.setInput('metrics', [metricDefinition('TEMPERATURE')!]);
    fixture.detectChanges();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);
    const component = fixture.componentInstance as unknown as {
      rows: () => ThresholdRow[];
      error: () => { key: string; params?: Record<string, string | number> } | null;
      submit(): void;
    };
    return { component, saved };
  }

  it('saves valid limits', () => {
    const { component, saved } = create();
    Object.assign(component.rows()[0], { enabled: true, criticalMin: 0, normalMin: 2, normalMax: 8, criticalMax: 10 });
    component.submit();
    expect(component.error()).toBeNull();
    expect(saved).toHaveBeenCalledWith([
      { metric: 'TEMPERATURE', criticalMin: 0, normalMin: 2, normalMax: 8, criticalMax: 10 },
    ]);
  });

  it('shows the range of the metric, with its name, and saves nothing', () => {
    const { component, saved } = create();
    Object.assign(component.rows()[0], { enabled: true, criticalMin: -500, normalMin: 2, normalMax: 8, criticalMax: 10 });
    component.submit();
    expect(saved).not.toHaveBeenCalled();
    expect(component.error()?.key).toBe('tracking.profiles.errors.out-of-range');
    expect(component.error()?.params).toEqual({ metric: 'tracking.metrics.TEMPERATURE', min: -100, max: 150, unit: '°C' });
  });
});
