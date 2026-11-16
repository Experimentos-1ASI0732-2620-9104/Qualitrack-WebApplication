import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { MeasurementSummary } from '../../../domain/model/kpi-dashboard.entity';
import { OverviewEnvironmentalProfile } from '../../../domain/model/overview-environmental-profile.entity';
import { KpiSummaryCards } from './kpi-summary-cards';

const summary = (deviceId: number, average: number): MeasurementSummary => ({
  environmentId: 1,
  deviceId,
  metric: 'TEMPERATURE',
  unit: '°C',
  readings: 40,
  average,
  minimum: average - 1,
  maximum: average + 1,
  firstMeasuredAt: '2026-11-01T10:00:00Z',
  lastMeasuredAt: '2026-11-02T10:00:00Z',
});

const profile = new OverviewEnvironmentalProfile(1, 'CONTAINER_MONITOR', 7, 1, 12, 1, [
  { metric: 'TEMPERATURE', normalMin: 2, normalMax: 8, criticalMin: 0, criticalMax: 12 },
], [], null, null);

describe('KpiSummaryCards', () => {
  function render(summaries: MeasurementSummary[]): HTMLElement {
    TestBed.configureTestingModule({ imports: [KpiSummaryCards], providers: [provideTranslateService()] });
    TestBed.inject(TranslateService).setTranslation('en', {
      reporting: {
        summary: {
          'state-normal': 'Normal',
          'state-warning': 'Warning',
          'state-critical': 'Critical',
          'state-unconfigured': 'No threshold',
          min: 'min',
          max: 'max',
        },
      },
      tracking: { metrics: { TEMPERATURE: 'Temperature' } },
    });
    TestBed.inject(TranslateService).use('en');
    const fixture = TestBed.createComponent(KpiSummaryCards);
    fixture.componentRef.setInput('summaries', summaries);
    fixture.componentRef.setInput('deviceNameFn', (id: number) => (id === 12 ? 'Monitor A' : null));
    fixture.componentRef.setInput('profiles', { 12: profile });
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('tells apart the devices, by their identifier while the name is unknown', () => {
    const titles = [...render([summary(12, 5), summary(13, 5)]).querySelectorAll('.variable')].map((title) => title.textContent!.trim());
    expect(titles).toEqual(['Temperature · Monitor A', 'Temperature · #13']);
  });

  it.each([
    [5, 'Normal'],
    [9, 'Warning'],
    [1, 'Warning'],
    [13, 'Critical'],
    [-1, 'Critical'],
  ])('evaluates readings around %s against the limits of the device as %s', (average, label) => {
    expect(render([summary(12, average)]).querySelector('.status-badge')!.textContent).toContain(label);
  });

  it('shows the worst state of the period, even if the average is normal', () => {
    const critical = { ...summary(12, 5), maximum: 13.9 };
    const warning = { ...summary(12, 5), minimum: 1 };
    const badges = [...render([critical, warning]).querySelectorAll('.status-badge')].map((badge) => badge.textContent);
    expect(badges[0]).toContain('Critical');
    expect(badges[1]).toContain('Warning');
  });

  it('says that a device without a profile has no threshold', () => {
    expect(render([summary(13, 5)]).querySelector('.status-badge')!.textContent).toContain('No threshold');
  });

  it('translates the range of the readings', () => {
    const labels = render([summary(12, 5)]).querySelector('.range-labels')!.textContent!;
    expect(labels).toContain('min 4');
    expect(labels).toContain('max 6');
  });
});
