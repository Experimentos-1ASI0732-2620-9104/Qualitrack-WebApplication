import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import {
  AlertSeverity,
  AlertStatus,
  DeviationAlert,
} from '../../../domain/model/deviation-alert.entity';
import { AlertCard } from './alert-card';

const alertOf = (
  changes: { severity?: AlertSeverity; status?: AlertStatus; normalizedAt?: string } = {},
) =>
  new DeviationAlert({
    id: 7,
    environmentId: 1,
    origin: 'CONTAINER',
    equipmentId: 3,
    parameterName: 'AIR_QUALITY',
    recordedValue: 951,
    thresholdValue: 900,
    unit: 'ppm',
    timestamp: '2026-10-04T22:01:00Z',
    severity: 'CRITICAL',
    status: 'UNRESOLVED',
    acknowledgedAt: changes.status === 'ACKNOWLEDGED' ? '2026-10-05T10:00:00Z' : null,
    ...changes,
  });

@Component({ template: '' })
class AlertDetailPage {}

describe('AlertCard', () => {
  function create(alert: DeviationAlert, canAttend = true) {
    TestBed.configureTestingModule({
      imports: [AlertCard],
      providers: [
        provideRouter([{ path: 'alerts/:alertId', component: AlertDetailPage }]),
        provideTranslateService(),
      ],
    });
    const fixture = TestBed.createComponent(AlertCard);
    fixture.componentRef.setInput('alert', alert);
    fixture.componentRef.setInput('deviceName', 'Monitor PROD');
    fixture.componentRef.setInput('environmentLabel', 'PROD-01 · Production');
    fixture.componentRef.setInput('canAttend', canAttend);
    fixture.componentRef.setInput('now', new Date('2026-11-01T22:01:00Z'));
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const actions = () =>
      Array.from(element.querySelectorAll('.actions a, .actions button')).map((action) =>
        action.textContent?.replace(/[a-z_]+\s+(?=ca-alerts)/, '').trim(),
      );
    /** Actions of the menu of the row, which opens over the page. */
    const menuItems = () => {
      element.querySelector<HTMLButtonElement>('.actions .more')!.click();
      fixture.detectChanges();
      return Array.from(document.querySelectorAll('.mat-mdc-menu-item')).map((item) =>
        item.textContent?.replace(/[a-z_]+\s+(?=ca-alerts)/, '').trim(),
      );
    };
    return { fixture, element, actions, menuItems };
  }

  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((item) => item.remove()));

  it('tells what deviated, where and how far from the limit', () => {
    const { element } = create(alertOf());

    expect(element.querySelector('h2')?.textContent).toBe('AIR_QUALITY · Monitor PROD');
    expect(element.querySelector('.origin')?.textContent).toContain('PROD-01 · Production');
    expect(element.querySelector('.value')?.textContent).toBe('951 ppm');
    expect(element.querySelector('.excess')?.textContent).toContain('+5.7');
    expect(element.querySelector('.excess')?.textContent).toContain('%');
    expect(element.querySelector('article')?.classList).toContain('severity-critical');
  });

  it('writes out how serious the alert is and whether someone has it', () => {
    const { element, fixture } = create(alertOf());

    expect(element.querySelector('.origin .severity')?.textContent).toBe('ca-alerts.severity.critical');
    expect(element.querySelector('.owner.unowned')?.textContent).toContain('ca-alerts.active.card.no-owner');

    fixture.componentRef.setInput('alert', alertOf({ status: 'ACKNOWLEDGED' }));
    fixture.detectChanges();
    expect(element.querySelector('.owner.unowned')).toBeNull();
    expect(element.querySelector('.owner')?.textContent).toContain('ca-alerts.active.card.attending');
  });

  it('draws the reading against its limit on one scale', () => {
    const { element } = create(alertOf());
    const fill = element.querySelector<HTMLElement>('.gauge .fill')!;
    const mark = element.querySelector<HTMLElement>('.gauge .limit-mark')!;

    expect(parseFloat(fill.style.width)).toBeGreaterThan(parseFloat(mark.style.left));
    expect(parseFloat(fill.style.width)).toBeLessThan(100);
  });

  it('names the device by its id while its name is unknown', () => {
    const { fixture, element } = create(alertOf());

    fixture.componentRef.setInput('deviceName', null);
    fixture.detectChanges();

    expect(element.querySelector('h2')?.textContent).toBe('AIR_QUALITY · #3');
  });

  it('shows an excess under the limit going down', () => {
    const { element } = create(new DeviationAlert({ ...alertOf(), recordedValue: 450 }));

    expect(element.querySelector('.excess')?.textContent).toContain('−50');
    expect(element.querySelector('.excess mat-icon')?.textContent).toBe('arrow_downward');
  });

  it('offers to attend an alert nobody attends, and the rest in its menu', () => {
    const { fixture, element, actions, menuItems } = create(alertOf());
    const attend = vi.fn();
    fixture.componentInstance.attend.subscribe(attend);

    expect(actions()[0]).toBe('ca-alerts.actions.acknowledge');
    expect(menuItems()).toEqual(['ca-alerts.actions.view-details', 'ca-alerts.active.card.notify']);
    element.querySelector<HTMLButtonElement>('button[mat-flat-button]')!.click();
    expect(attend).toHaveBeenCalledTimes(1);
  });

  it('offers to resolve an alert being attended', () => {
    const { element, actions } = create(alertOf({ status: 'ACKNOWLEDGED' }));

    expect(actions()).toContain('ca-alerts.active.card.resolve');
    expect(actions()).not.toContain('ca-alerts.actions.acknowledge');
    expect(element.querySelector('.primary-btn')?.getAttribute('href')).toBe(
      '/alerts/7?panel=resolve',
    );
  });

  it('only offers the e-mail for critical alerts', () => {
    const { menuItems } = create(alertOf({ severity: 'WARNING' }));

    expect(menuItems()).toEqual(['ca-alerts.actions.view-details']);
  });

  it('only offers the detail to who cannot attend alerts', () => {
    const { actions } = create(alertOf(), false);

    expect(actions()).toEqual(['ca-alerts.actions.view-details']);
  });

  it('shows the condition went back to normal', () => {
    const { element } = create(alertOf({ normalizedAt: '2026-10-06T00:00:00Z' }));

    expect(element.querySelector('.normalized')?.textContent).toContain('ca-alerts.normalized');
  });

  it('warns the view before leaving the inbox', async () => {
    const { fixture, element } = create(alertOf());
    const opening = vi.fn();
    fixture.componentInstance.opening.subscribe(opening);

    element.querySelector<HTMLAnchorElement>('h2 a')!.click();
    await fixture.whenStable();

    expect(opening).toHaveBeenCalledTimes(1);
  });

  it('can move the focus to its main action', () => {
    const { fixture, element } = create(alertOf());
    document.body.append(element);

    fixture.componentInstance.focusPrimaryAction();

    expect(document.activeElement).toBe(element.querySelector('[mat-flat-button]'));
    element.remove();
  });

  it('gives each action a name that tells the cards apart', () => {
    const { element } = create(alertOf());

    expect(element.querySelector('[mat-flat-button]')?.getAttribute('aria-label')).toBe(
      'ca-alerts.actions.acknowledge: AIR_QUALITY · Monitor PROD',
    );
  });

  it('names who attends the alert when it is known', () => {
    const { element, fixture } = create(alertOf({ status: 'ACKNOWLEDGED' }));
    expect(element.querySelector('.meta')?.textContent).toContain(
      'ca-alerts.active.card.attending',
    );
    expect(element.querySelector('.meta')?.textContent).not.toContain('attending-by');

    fixture.componentRef.setInput('attendedBy', 'Billy Ruiz');
    fixture.detectChanges();

    expect(element.querySelector('.meta')?.textContent).toContain(
      'ca-alerts.active.card.attending-by',
    );
  });

  it('can take the focus and knows what is inside it', () => {
    const { element, fixture } = create(alertOf());
    document.body.appendChild(element);

    fixture.componentInstance.focus();

    expect(document.activeElement).toBe(element.querySelector('.alert-card'));
    expect(fixture.componentInstance.contains(element.querySelector('h2')!)).toBe(true);
    expect(fixture.componentInstance.contains(document.body)).toBe(false);
    element.remove();
  });
});
