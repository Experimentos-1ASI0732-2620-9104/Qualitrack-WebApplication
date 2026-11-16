import { TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { CaStore } from '../../../application/ca.store';
import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { AlertTable } from './alert-table';

const alert = new DeviationAlert({
  id: 7,
  environmentId: 1,
  origin: 'ENVIRONMENT',
  equipmentId: 1,
  parameterName: 'HUMIDITY',
  recordedValue: 71,
  thresholdValue: 70,
  unit: '%RH',
  timestamp: '2026-10-04T22:01:00Z',
  severity: 'WARNING',
  status: 'UNRESOLVED',
  deviationCount: 1,
});

describe('AlertTable', () => {
  const open = () => {
    TestBed.configureTestingModule({ imports: [AlertTable], providers: [
      provideRouter([]), provideTranslateService(),
      { provide: CaStore, useValue: { deviceName: () => 'Monitor ALM-MP', personName: () => null } },
    ] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { 'ca-alerts': {
      history: { view: 'View the detail of the {{variable}} alert' },
      actions: { 'view-details': 'View detail' },
    } });
    translate.use('en');
    const fixture = TestBed.createComponent(AlertTable);
    fixture.componentRef.setInput('alerts', [alert]);
    fixture.componentRef.setInput('now', new Date('2026-10-05T00:00:00Z'));
    fixture.detectChanges();
    return fixture;
  };

  it('offers the detail of an alert with the eye alone, keeping the words for assistive technology', () => {
    const fixture = open();
    const element = fixture.nativeElement as HTMLElement;
    const action = element.querySelector('a[href^="/alerts/history/7"]') as HTMLAnchorElement;
    const icon = action.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('visibility');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(action.textContent?.trim()).toBe('visibility');
    expect(action.getAttribute('aria-label')).toContain('View the detail of the');
    expect(fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip).message).toBe('View detail');
  });
});
