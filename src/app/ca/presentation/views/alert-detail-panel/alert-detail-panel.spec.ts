import { Location } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';

import { IamStore } from '../../../../iam/application/iam.store';
import {
  UndoToastOpener,
  UndoToastOutcome,
} from '../../../../shared/presentation/components/undo-toast/undo-toast';
import { AlertDevice } from '../../../domain/model/alert-device.entity';
import { AlertPerson } from '../../../domain/model/alert-person.entity';
import { AlertStatus, DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { CaStore } from '../../../application/ca.store';
import { CaApi } from '../../../infrastructure/ca-api';
import { AlertTimeline } from '../../components/alert-timeline/alert-timeline';
import { AlertDetailPanel } from './alert-detail-panel';

const alertOf = (status: AlertStatus, changes: Partial<DeviationAlert> = {}) =>
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
    status,
    ...changes,
  });

@Component({ template: '' })
class ListPage {}

describe('AlertDetailPanel', () => {
  const api = {
    getAlertDevices: vi.fn(),
    getAlertPeople: vi.fn(),
    getAlertById: vi.fn(),
    acknowledgeAlert: vi.fn(),
    resolveAlert: vi.fn(),
    sendAlertEmailNotification: vi.fn(),
  };
  const undoToast = { open: vi.fn(), confirmNow: vi.fn() };
  const canOperate = signal(true);
  let toastOutcome: Subject<UndoToastOutcome>;

  beforeEach(() => {
    toastOutcome = new Subject();
    canOperate.set(true);
    api.getAlertDevices
      .mockReset()
      .mockReturnValue(of([new AlertDevice({ id: 3, name: 'Monitor PROD' } as never)]));
    api.getAlertPeople
      .mockReset()
      .mockReturnValue(of([new AlertPerson({ id: 12, name: 'Billy Ruiz' })]));
    api.getAlertById.mockReset().mockReturnValue(of(alertOf('ACKNOWLEDGED')));
    api.acknowledgeAlert.mockReset();
    api.resolveAlert.mockReset();
    api.sendAlertEmailNotification.mockReset();
    undoToast.open.mockReset().mockReturnValue(toastOutcome);
    undoToast.confirmNow.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'alerts', component: ListPage },
          { path: 'alerts/:alertId', component: AlertDetailPanel },
        ]),
        provideTranslateService(),
        { provide: CaApi, useValue: api },
        { provide: UndoToastOpener, useValue: undoToast },
        {
          provide: IamStore,
          useValue: {
            canOperate,
            currentUserId: signal(27),
            requireLaboratoryId: () => 42,
            beforeSignOut: () => undefined,
          },
        },
      ],
    });
  });

  afterEach(() =>
    document.body
      .querySelectorAll('[ng-version], .cdk-overlay-container')
      .forEach((item) => item.remove()),
  );

  async function open(url = '/alerts/7') {
    const harness = await RouterTestingHarness.create(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    const element = document.body;
    const buttonWith = (text: string) =>
      Array.from(element.querySelectorAll<HTMLButtonElement>('.next-actions button, .panel-actions button')).find(
        (item) => item.textContent?.includes(text),
      );
    const write = (notes: string) => {
      const textarea = element.querySelector('textarea')!;
      textarea.value = notes;
      textarea.dispatchEvent(new Event('input'));
      harness.detectChanges();
    };
    const submit = async () => {
      element.querySelector('form')!.dispatchEvent(new Event('submit'));
      await harness.fixture.whenStable();
      harness.detectChanges();
    };
    return { harness, element, buttonWith, write, submit };
  }

  it('reads the alert of the address', async () => {
    const { element } = await open();

    expect(api.getAlertById).toHaveBeenCalledWith(7);
    expect(element.querySelector('app-alert-timeline')).not.toBeNull();
    expect(element.querySelector('.reading .value')?.textContent).toContain('951');
  });

  it('follows the address when it changes, with an empty form', async () => {
    const { harness, element, write } = await open();
    write('Door closed and checked.');
    api.getAlertById.mockReturnValue(of(alertOf('ACKNOWLEDGED', { id: 8 })));

    await TestBed.inject(Router).navigateByUrl('/alerts/8');
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(api.getAlertById).toHaveBeenLastCalledWith(8);
    expect(element.querySelector('textarea')?.value).toBe('');
  });

  it('tells when the alert cannot be read', async () => {
    api.getAlertById.mockReturnValue(throwError(() => new Error('down')));
    const { element } = await open();

    expect(element.querySelector('.error')?.textContent).toContain('ca-alerts.errors.failed');
  });

  it('shows the people by name, or by their account while it is unknown', async () => {
    api.getAlertById.mockReturnValue(
      of(alertOf('RESOLVED', { acknowledgedBy: 12, resolvedBy: 13 })),
    );
    const { harness } = await open();
    TestBed.inject(CaStore).loadPeople();
    harness.detectChanges();

    const timeline = harness.fixture.debugElement.query(By.directive(AlertTimeline))
      .componentInstance as AlertTimeline;
    expect(timeline.attendedBy()).toBe('Billy Ruiz');
    expect(timeline.resolvedBy()).toBe('ca-alerts.detail.user');
  });

  it('only lets read a resolved alert', async () => {
    api.getAlertById.mockReturnValue(of(alertOf('RESOLVED')));
    const { element, buttonWith } = await open();

    expect(element.querySelector('form')).toBeNull();
    expect(buttonWith('ca-alerts.actions.acknowledge')).toBeUndefined();
    expect(buttonWith('ca-alerts.active.card.notify')).toBeUndefined();
  });

  it('asks to attend an alert nobody attends before its corrective action', async () => {
    api.getAlertById.mockReturnValue(of(alertOf('UNRESOLVED')));
    const { element, buttonWith } = await open();

    expect(element.querySelector('.next-step h3')?.textContent).toBe('ca-alerts.detail.next.attend-title');
    expect(buttonWith('ca-alerts.actions.acknowledge')).toBeDefined();
    expect(element.querySelector('form')).toBeNull();
  });

  it('asks for the corrective action once someone attends the alert', async () => {
    const { element, buttonWith } = await open();

    expect(element.querySelector('.next-step form')).not.toBeNull();
    expect(buttonWith('ca-alerts.actions.acknowledge')).toBeUndefined();
  });

  it('only lets read to who cannot attend alerts', async () => {
    canOperate.set(false);
    api.getAlertById.mockReturnValue(of(alertOf('UNRESOLVED')));
    const { element, buttonWith } = await open();

    expect(element.querySelector('form')).toBeNull();
    expect(buttonWith('ca-alerts.actions.acknowledge')).toBeUndefined();
  });

  describe('attention', () => {
    beforeEach(() => api.getAlertById.mockReturnValue(of(alertOf('UNRESOLVED'))));

    it('gives time to undo it, sending nothing yet', async () => {
      const { harness, buttonWith } = await open();

      buttonWith('ca-alerts.actions.acknowledge')!.click();
      harness.detectChanges();

      expect(undoToast.open).toHaveBeenCalledTimes(1);
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
      expect(buttonWith('ca-alerts.actions.acknowledge')).toBeUndefined();
    });

    it('lets the focus reach the toast while it lasts', async () => {
      const { harness, element, buttonWith } = await open();
      const anchors = () => element.querySelectorAll<HTMLElement>('.cdk-focus-trap-anchor');
      const tabbable = () => anchors()[0]?.getAttribute('tabindex');
      expect(tabbable()).toBe('0');

      buttonWith('ca-alerts.actions.acknowledge')!.click();
      harness.detectChanges();
      expect(tabbable()).toBeNull();

      toastOutcome.next('undone');
      harness.detectChanges();
      expect(tabbable()).toBe('0');
      expect(buttonWith('ca-alerts.actions.acknowledge')).toBeDefined();
    });

    it('sends it when the time ends', async () => {
      api.acknowledgeAlert.mockReturnValue(of(alertOf('ACKNOWLEDGED')));
      const { harness, buttonWith } = await open();
      buttonWith('ca-alerts.actions.acknowledge')!.click();

      toastOutcome.next('confirmed');
      harness.detectChanges();

      expect(api.acknowledgeAlert).toHaveBeenCalledWith(7);
    });
  });

  describe('resolution', () => {
    it('sends the corrective action and closes', async () => {
      api.resolveAlert.mockReturnValue(of(alertOf('RESOLVED')));
      const location = TestBed.inject(Location);
      const { harness, write, submit } = await open();
      write('The filter was replaced.');

      await submit();
      await harness.fixture.whenStable();

      expect(api.resolveAlert).toHaveBeenCalledWith(7, {
        resolutionNotes: 'The filter was replaced.',
      });
      expect(location.path()).toBe('/alerts');
      expect(TestBed.inject(CaStore).notice()).toBe('ca-alerts.resolved');
    });

    it('stays open and tells when it could not be saved', async () => {
      api.resolveAlert.mockReturnValue(throwError(() => new Error('down')));
      const location = TestBed.inject(Location);
      const { element, write, submit } = await open();
      write('The filter was replaced.');

      await submit();

      expect(location.path()).toBe('/alerts/7');
      expect(element.querySelector('.error')?.textContent).toContain('ca-alerts.errors.failed');
      expect(element.querySelector('textarea')?.value).toBe('The filter was replaced.');
    });

    it('sends first an attention that can still be undone', async () => {
      api.getAlertById.mockReturnValue(of(alertOf('UNRESOLVED')));
      const { harness, buttonWith, write, submit } = await open();
      buttonWith('ca-alerts.actions.acknowledge')!.click();
      // Attending moves the alert to its next step, the corrective action
      harness.detectChanges();
      write('The filter was replaced.');
      api.resolveAlert.mockReturnValue(of(alertOf('RESOLVED')));
      api.acknowledgeAlert.mockReturnValue(of(alertOf('ACKNOWLEDGED')));

      await submit();

      expect(undoToast.confirmNow).toHaveBeenCalledTimes(1);
      expect(api.acknowledgeAlert).toHaveBeenCalledWith(7);
      expect(api.resolveAlert).toHaveBeenCalled();
    });

    it('starts on the corrective action when opened to resolve', async () => {
      api.getAlertById.mockReturnValue(of(alertOf('ACKNOWLEDGED')));
      const harness = await RouterTestingHarness.create();
      document.body.appendChild(harness.fixture.nativeElement);
      await harness.navigateByUrl('/alerts/7?panel=resolve');
      await harness.fixture.whenStable();
      const element = document.body;

      await vi.waitFor(() =>
        expect(document.activeElement).toBe(element.querySelector('textarea')),
      );
    });
  });

  describe('closing', () => {
    it('goes back to where the person came from', async () => {
      const harness = await RouterTestingHarness.create('/alerts?environmentId=1');
      await harness.navigateByUrl('/alerts/7?environmentId=1');
      await harness.fixture.whenStable();
      harness.detectChanges();
      const location = TestBed.inject(Location);
      const back = vi.spyOn(location, 'back');

      document.querySelector<HTMLElement>('.panel-header button')!.click();

      expect(back).toHaveBeenCalledTimes(1);
    });

    it('goes to the inbox when it was the first thing opened, leaving the environment', async () => {
      const { harness, element } = await open('/alerts/7?environmentId=1&panel=resolve');

      element.querySelector<HTMLElement>('.panel-header button')!.click();
      await harness.fixture.whenStable();

      expect(TestBed.inject(Location).path()).toBe('/alerts?environmentId=1');
    });

    it('forgets the alert and its error', async () => {
      api.getAlertById.mockReturnValue(throwError(() => new Error('down')));
      const { harness } = await open();
      const store = TestBed.inject(CaStore);
      expect(store.error()).not.toBeNull();

      await TestBed.inject(Router).navigateByUrl('/alerts');
      await harness.fixture.whenStable();

      expect(store.error()).toBeNull();
      expect(store.selectedAlert()).toBeNull();
    });
  });
});
