import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { AlertHistoryCards } from './alert-history-cards';

const alertOf = (fields: Partial<DeviationAlert>) =>
  ({
    timestamp: '2026-10-01T10:00:00Z',
    severity: 'WARNING',
    status: 'UNRESOLVED',
    acknowledgedAt: null,
    resolvedAt: null,
    ...fields,
  }) as DeviationAlert;

describe('AlertHistoryCards', () => {
  function render(alerts: DeviationAlert[]): string {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(AlertHistoryCards);
    fixture.componentRef.setInput('alerts', alerts);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
  }

  it('counts the alerts, the resolved ones and their average times', () => {
    const text = render([
      alertOf({
        severity: 'CRITICAL',
        status: 'RESOLVED',
        acknowledgedAt: '2026-10-01T10:30:00Z',
        resolvedAt: '2026-10-01T14:00:00Z',
      }),
      alertOf({ status: 'ACKNOWLEDGED', acknowledgedAt: '2026-10-01T11:30:00Z' }),
    ]);

    expect(text).toContain(' 2 ');
    expect(text).toContain('ca-alerts.severity.critical 1');
    expect(text).toContain('ca-alerts.severity.warning 1');
    expect(text).toContain('ca-alerts.history.metrics.percent');
    expect(text).toContain('1 hour');
    expect(text).toContain('4 hours');
  });

  it('shows a dash when no alert was attended or resolved yet', () => {
    const text = render([alertOf({})]);

    expect(text.match(/ca-alerts\.history\.metrics\.no-time/g)).toHaveLength(2);
  });
});
