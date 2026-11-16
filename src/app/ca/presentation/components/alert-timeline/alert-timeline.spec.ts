import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { AlertTimeline } from './alert-timeline';

const baseAlert = {
  id: 1,
  equipmentId: 2,
  parameterName: 'AIR_QUALITY',
  recordedValue: 935,
  thresholdValue: 900,
  unit: 'ppm',
  timestamp: '2026-10-03T14:00:00Z',
  severity: 'CRITICAL',
  status: 'UNRESOLVED',
} as const;

describe('AlertTimeline', () => {
  let fixture: ComponentFixture<AlertTimeline>;
  let component: ComponentRef<AlertTimeline>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(AlertTimeline);
    component = fixture.componentRef;
    component.setInput('deviceName', 'Monitor ALM-MP');
  });

  function steps(alert: Partial<ConstructorParameters<typeof DeviationAlert>[0]>): string[] {
    component.setInput('alert', new DeviationAlert({ ...baseAlert, ...alert }));
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('li strong')).map(
      (step) => step.textContent!.trim(),
    );
  }

  it('tells what an alert nobody attends is still missing', () => {
    expect(steps({})).toEqual([
      'ca-alerts.detail.step.detected',
      'ca-alerts.detail.step.waiting-attention',
      'ca-alerts.detail.step.waiting-resolution',
    ]);
  });

  it('orders what happened by when it happened', () => {
    expect(
      steps({
        status: 'ACKNOWLEDGED',
        normalizedAt: '2026-10-03T15:00:00Z',
        acknowledgedAt: '2026-10-03T16:00:00Z',
      }),
    ).toEqual([
      'ca-alerts.detail.step.detected',
      'ca-alerts.normalized',
      'ca-alerts.detail.step.attending',
      'ca-alerts.detail.step.waiting-resolution',
    ]);
  });

  it('mentions the last deviation only when the incident had more than one', () => {
    const lastDetectedAt = '2026-10-03T14:30:00Z';
    expect(steps({ deviationCount: 1, lastDetectedAt })).not.toContain(
      'ca-alerts.detail.step.last-deviation',
    );
    expect(steps({ deviationCount: 4, lastDetectedAt })).toContain(
      'ca-alerts.detail.step.last-deviation',
    );
  });

  it('shows the corrective action of a resolved alert and nothing pending', () => {
    const shown = steps({
      status: 'RESOLVED',
      acknowledgedAt: '2026-10-03T14:14:00Z',
      resolvedAt: '2026-10-04T14:00:00Z',
      resolutionNotes: 'Filter replaced',
    });
    expect(shown.at(-1)).toBe('ca-alerts.detail.step.resolved');
    expect((fixture.nativeElement as HTMLElement).querySelector('.notes')?.textContent).toBe(
      'Filter replaced',
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('.pending')).toBeNull();
  });
});
