import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { DataPoint, DeviationTrend } from '../../../domain/model/deviation-trend.entity';
import { OverviewEnvironmentalThreshold } from '../../../domain/model/overview-environmental-profile.entity';
import { DeviationEvents } from './deviation-events';

const event = (recordedValue: number, state: DataPoint['state']): DataPoint => ({
  timestamp: '2026-11-01T10:00:00Z',
  recordedValue,
  upperThreshold: null,
  lowerThreshold: null,
  state,
});

const thresholds: OverviewEnvironmentalThreshold = {
  metric: 'TEMPERATURE',
  normalMin: 2,
  normalMax: 8,
  criticalMin: 0,
  criticalMax: 12,
};

describe('DeviationEvents', () => {
  function limitsShown(points: DataPoint[], limits: OverviewEnvironmentalThreshold | null): (string | undefined)[] {
    TestBed.configureTestingModule({ imports: [DeviationEvents], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(DeviationEvents);
    fixture.componentRef.setInput('trend', new DeviationTrend({
      id: null,
      parameterName: 'TEMPERATURE',
      equipmentId: 12,
      unit: '°C',
      trendDirection: 'STABLE',
      dataPoints: points,
    }));
    fixture.componentRef.setInput('thresholds', limits);
    fixture.detectChanges();
    const rows: HTMLElement[] = [...fixture.nativeElement.querySelectorAll('.event-row')];
    return rows.map((row) => row.querySelector('small')?.textContent?.replace(/\s+/g, ' ').trim());
  }

  it('tells the limit each event crossed, from the profile of the device', () => {
    const points = [event(13, 'CRITICAL'), event(9, 'WARNING'), event(1, 'WARNING'), event(-1, 'CRITICAL')];
    const limits = limitsShown(points, thresholds);
    expect(limits[0]).toContain('12 °C');
    expect(limits[1]).toContain('8 °C');
    expect(limits[2]).toContain('2 °C');
    expect(limits[3]).toContain('0 °C');
  });

  it('shows no limit when the device has no profile, instead of an empty one', () => {
    expect(limitsShown([event(13, 'CRITICAL')], null)).toEqual([undefined]);
  });
});
