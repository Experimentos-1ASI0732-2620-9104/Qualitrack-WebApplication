import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';

import { IamStore } from '../../../../iam/application/iam.store';
import {
  UndoToastOpener,
  UndoToastOutcome,
} from '../../../../shared/presentation/components/undo-toast/undo-toast';
import { AlertDevice } from '../../../domain/model/alert-device.entity';
import { AlertEnvironment } from '../../../domain/model/alert-environment.entity';
import { AlertPerson } from '../../../domain/model/alert-person.entity';
import {
  AlertSeverity,
  AlertStatus,
  DeviationAlert,
} from '../../../domain/model/deviation-alert.entity';
import { CaStore } from '../../../application/ca.store';
import { CaApi } from '../../../infrastructure/ca-api';
import { AlertDashboard } from './alert-dashboard';

const alertOf = (
  id: number,
  environmentId: number,
  severity: AlertSeverity,
  status: AlertStatus,
  timestamp: string,
  normalizedAt: string | null = null,
) =>
  new DeviationAlert({
    id,
    environmentId,
    origin: 'ENVIRONMENT',
    equipmentId: id,
    parameterName: 'AIR_QUALITY',
    recordedValue: 951,
    thresholdValue: 900,
    unit: 'ppm',
    timestamp,
    severity,
    status,
    acknowledgedAt: status === 'ACKNOWLEDGED' ? timestamp : null,
    normalizedAt,
  });

const newerCritical = alertOf(1, 1, 'CRITICAL', 'UNRESOLVED', '2026-10-05T10:00:00Z');
const olderCritical = alertOf(2, 2, 'CRITICAL', 'UNRESOLVED', '2026-10-04T10:00:00Z');
const attendedCritical = alertOf(
  3,
  1,
  'CRITICAL',
  'ACKNOWLEDGED',
  '2026-10-03T10:00:00Z',
  '2026-10-06T10:00:00Z',
);
const warning = alertOf(4, 2, 'WARNING', 'UNRESOLVED', '2026-10-01T10:00:00Z');

@Component({ template: '<p class="detail-page"></p>' })
class AlertDetailPage {}

describe('AlertDashboard', () => {
  const api = {
    getAlertEnvironments: vi.fn(),
    getAlertDevices: vi.fn(),
    getAlertPeople: vi.fn(),
    getEnvironmentAlerts: vi.fn(),
    acknowledgeAlert: vi.fn(),
    getAlertById: vi.fn(),
    sendAlertEmailNotification: vi.fn(),
  };
  const undoToast = { open: vi.fn(), confirmNow: vi.fn() };
  const liveAnnouncer = { announce: vi.fn() };
  const canOperate = signal(true);
  let toastOutcome: Subject<UndoToastOutcome>;

  beforeEach(() => {
    toastOutcome = new Subject();
    canOperate.set(true);
    api.getAlertEnvironments
      .mockReset()
      .mockReturnValue(
        of([
          new AlertEnvironment({ id: 1, code: 'ALM-01', name: 'Almacén', usage: null }),
          new AlertEnvironment({ id: 2, code: 'PROD-01', name: 'Producción', usage: null }),
        ]),
      );
    api.getAlertDevices
      .mockReset()
      .mockReturnValue(
        of(
          [1, 2, 3, 4].map(
            (id) =>
              new AlertDevice({ id, name: id === 2 ? 'Cámara fría' : `Device ${id}` } as never),
          ),
        ),
      );
    api.getAlertPeople
      .mockReset()
      .mockReturnValue(of([new AlertPerson({ id: 12, name: 'Billy Ruiz' })]));
    answer({ 1: [newerCritical, attendedCritical], 2: [olderCritical, warning] });
    api.acknowledgeAlert.mockReset();
    api.getAlertById.mockReset();
    api.sendAlertEmailNotification.mockReset();
    undoToast.open.mockReset().mockReturnValue(toastOutcome);
    undoToast.confirmNow.mockReset();
    liveAnnouncer.announce.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'alerts',
            component: AlertDashboard,
            children: [{ path: ':alertId', component: AlertDetailPage }],
          },
        ]),
        provideTranslateService(),
        { provide: CaApi, useValue: api },
        { provide: UndoToastOpener, useValue: undoToast },
        { provide: LiveAnnouncer, useValue: liveAnnouncer },
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

  afterEach(() => vi.useRealTimers());

  function answer(alertsByEnvironment: Record<number, DeviationAlert[]>) {
    api.getEnvironmentAlerts
      .mockReset()
      .mockImplementation((_laboratoryId: number, environmentId: number) =>
        alertsByEnvironment[environmentId]
          ? of(alertsByEnvironment[environmentId])
          : throwError(() => new Error('unavailable')),
      );
  }

  async function open(url = '/alerts') {
    const harness = await RouterTestingHarness.create(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    const cardIds = () =>
      Array.from(element.querySelectorAll('app-alert-card h2')).map(
        (title) => title.textContent?.split(' · ')[1],
      );
    const chip = (label: string) =>
      Array.from(element.querySelectorAll<HTMLButtonElement>('app-filter-chip button')).find(
        (button) => button.textContent?.includes(label),
      )!;
    const countOf = (label: string) => chip(label)?.querySelector('.count')?.textContent;
    const press = (target: HTMLElement) => {
      target.click();
      harness.detectChanges();
    };
    return { harness, element, cardIds, chip, countOf, press };
  }

  describe('scope', () => {
    it('opens with the alerts of every environment, the most urgent first', async () => {
      const { cardIds } = await open();

      expect(cardIds()).toEqual(['Cámara fría', 'Device 1', 'Device 3', 'Device 4']);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(2);
    });

    it('narrows to the environment of the address', async () => {
      const { cardIds } = await open('/alerts?environmentId=1');

      expect(cardIds()).toEqual(['Device 1', 'Device 3']);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(1);
    });

    it('treats an unknown environment in the address as every environment', async () => {
      const { cardIds } = await open('/alerts?environmentId=99');

      expect(cardIds()).toHaveLength(4);
    });

    it('follows the address when the environment changes', async () => {
      const { harness, cardIds } = await open();

      await TestBed.inject(Router).navigateByUrl('/alerts?environmentId=2');
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(cardIds()).toEqual(['Cámara fría', 'Device 4']);
    });

    it('reads the alerts again when a new environment appears', async () => {
      const { harness } = await open();
      api.getEnvironmentAlerts.mockClear();
      api.getAlertEnvironments.mockReturnValue(
        of([
          new AlertEnvironment({ id: 1, code: 'ALM-01', name: 'Almacén', usage: null }),
          new AlertEnvironment({ id: 2, code: 'PROD-01', name: 'Producción', usage: null }),
          new AlertEnvironment({ id: 3, code: 'NEW-01', name: 'Nuevo', usage: null }),
        ]),
      );

      await TestBed.inject(CaStore).loadEnvironments();
      await harness.fixture.whenStable();

      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(3);
    });

    it('does not read the alerts again when the environments are still the same', async () => {
      const { harness } = await open();
      api.getEnvironmentAlerts.mockClear();

      await TestBed.inject(CaStore).loadEnvironments();
      await harness.fixture.whenStable();

      expect(api.getEnvironmentAlerts).not.toHaveBeenCalled();
    });
  });

  describe('summary and filters', () => {
    it('counts the open alerts of the scope in its chips', async () => {
      const { countOf } = await open();

      expect(countOf('ca-alerts.active.filters.all')).toBe('4');
      expect(countOf('ca-alerts.active.filters.critical-unattended')).toBe('2');
      expect(countOf('ca-alerts.active.filters.unattended')).toBe('3');
      expect(countOf('ca-alerts.active.filters.attending')).toBe('1');
    });

    it('groups the alerts by severity, the most serious first', async () => {
      const { element } = await open();

      expect(
        Array.from(element.querySelectorAll('.group-title')).map((title) =>
          title.textContent?.replace(/\s+\d+\s*$/, '').trim(),
        ),
      ).toEqual(['ca-alerts.active.groups.CRITICAL', 'ca-alerts.active.groups.WARNING']);
    });

    it('filters when a chip is pressed and stops when it is pressed again', async () => {
      const { chip, press, cardIds } = await open();
      const attending = chip('ca-alerts.active.filters.attending');

      press(attending);
      expect(cardIds()).toEqual(['Device 3']);
      expect(attending.getAttribute('aria-pressed')).toBe('true');
      expect(chip('ca-alerts.active.filters.all').getAttribute('aria-pressed')).toBe('false');

      press(attending);
      expect(cardIds()).toHaveLength(4);
      expect(chip('ca-alerts.active.filters.all').getAttribute('aria-pressed')).toBe('true');
    });

    it('keeps the counts while filtering', async () => {
      const { chip, countOf, press } = await open();

      press(chip('ca-alerts.active.filters.attending'));

      expect(countOf('ca-alerts.active.filters.all')).toBe('4');
    });

    it('shows in red the critical alerts nobody attends, and leaves only them when pressed', async () => {
      const { chip, press, cardIds } = await open();
      const urgent = chip('ca-alerts.active.filters.critical-unattended');

      expect(urgent.classList).toContain('danger');
      press(urgent);

      expect(cardIds()).toEqual(['Cámara fría', 'Device 1']);
      expect(urgent.getAttribute('aria-pressed')).toBe('true');
    });

    it('searches by device without minding accents or capitals', async () => {
      const { harness, element, cardIds } = await open();
      const search = element.querySelector<HTMLInputElement>('.search input')!;

      search.value = 'CAMARA';
      search.dispatchEvent(new Event('input'));
      harness.detectChanges();

      expect(cardIds()).toEqual(['Cámara fría']);
      expect(element.querySelector('.result-count')?.textContent).toContain(
        'ca-alerts.active.results',
      );
    });

    it('offers to clear the filters when nothing matches', async () => {
      const { harness, element, press, cardIds } = await open();
      const search = element.querySelector<HTMLInputElement>('.search input')!;
      search.value = 'nothing like this';
      search.dispatchEvent(new Event('input'));
      harness.detectChanges();
      expect(cardIds()).toEqual([]);

      press(element.querySelector<HTMLButtonElement>('app-empty-state button')!);

      expect(cardIds()).toHaveLength(4);
    });

    it('orders each group by the latest incident when asked to', async () => {
      const { harness, element, press, cardIds } = await open();

      press(element.querySelector<HTMLElement>('.sort .mat-mdc-select-trigger')!);
      await harness.fixture.whenStable();
      press(document.querySelectorAll<HTMLElement>('mat-option')[1]);

      expect(cardIds()).toEqual(['Device 1', 'Cámara fría', 'Device 3', 'Device 4']);
    });

    describe('order by environment', () => {
      const sortOptions = () =>
        Array.from(document.querySelectorAll('mat-option')).map((option) => option.textContent?.trim());
      const openSort = async (harness: RouterTestingHarness, element: HTMLElement) => {
        element.querySelector<HTMLElement>('.sort .mat-mdc-select-trigger')!.click();
        harness.detectChanges();
        await harness.fixture.whenStable();
      };
      const shownSort = (element: HTMLElement) =>
        element.querySelector('.sort .mat-mdc-select-value')?.textContent?.trim();
      afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((item) => item.remove()));

      it('is only offered while every environment is shown', async () => {
        const { harness, element } = await open('/alerts?environmentId=1');

        await openSort(harness, element);

        expect(sortOptions()).toEqual([
          'ca-alerts.active.sort.priority',
          'ca-alerts.active.sort.newest',
        ]);
      });

      it('gives way to the priority with one environment, and comes back with every environment', async () => {
        const { harness, element, press } = await open();
        await openSort(harness, element);
        press(document.querySelectorAll<HTMLElement>('mat-option')[2]);
        expect(shownSort(element)).toBe('ca-alerts.active.sort.environment');

        await TestBed.inject(Router).navigateByUrl('/alerts?environmentId=1');
        await harness.fixture.whenStable();
        harness.detectChanges();
        expect(shownSort(element)).toBe('ca-alerts.active.sort.priority');

        await TestBed.inject(Router).navigateByUrl('/alerts');
        await harness.fixture.whenStable();
        harness.detectChanges();
        expect(shownSort(element)).toBe('ca-alerts.active.sort.environment');
      });
    });
  });

  describe('urgent chip', () => {
    it('does not appear when every critical alert is attended', async () => {
      answer({ 1: [attendedCritical], 2: [warning] });
      const { chip } = await open();

      expect(chip('ca-alerts.active.filters.critical-unattended')).toBeUndefined();
    });
  });

  describe('empty state', () => {
    it('gives the good news and what to do next', async () => {
      answer({ 1: [], 2: [] });
      const { element } = await open();
      const empty = element.querySelector('app-empty-state');

      expect(empty?.querySelector('h2')?.textContent).toBe('ca-alerts.active.empty.title');
      expect(empty?.querySelector('p')?.textContent).toBe('ca-alerts.active.empty.message-many');
      expect(
        Array.from(empty!.querySelectorAll('a')).map((link) => link.getAttribute('href')),
      ).toEqual(['/alerts/history', '/tracking/monitoring']);
    });

    it('never gives the good news when an environment could not be read', async () => {
      answer({ 1: [] });
      const { element } = await open();

      expect(element.querySelector('app-empty-state')).toBeNull();
      expect(element.querySelector('app-action-banner')?.textContent).toContain(
        'ca-alerts.active.unavailable',
      );
    });
  });

  describe('attention', () => {
    const primaryActionOf = (element: HTMLElement) =>
      element.querySelector<HTMLButtonElement>('app-alert-card button[mat-flat-button]')!;

    it('shows the alert as attended at once and gives time to undo it', async () => {
      const { element, press, countOf } = await open();

      press(primaryActionOf(element));

      expect(countOf('ca-alerts.active.filters.attending')).toBe('2');
      expect(undoToast.open).toHaveBeenCalledWith(
        expect.objectContaining({ messageKey: 'ca-alerts.active.attention-registered' }),
      );
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('sends nothing when it is undone', async () => {
      const { harness, element, press, countOf } = await open();
      press(primaryActionOf(element));

      toastOutcome.next('undone');
      harness.detectChanges();

      expect(countOf('ca-alerts.active.filters.attending')).toBe('1');
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('sends it when the time to undo ends', async () => {
      api.acknowledgeAlert.mockReturnValue(
        of(alertOf(2, 2, 'CRITICAL', 'ACKNOWLEDGED', '2026-10-04T10:00:00Z')),
      );
      const { element, press } = await open();
      press(primaryActionOf(element));

      toastOutcome.next('confirmed');

      expect(api.acknowledgeAlert).toHaveBeenCalledWith(2);
    });

    it('sends it even after the person left the view', async () => {
      api.acknowledgeAlert.mockReturnValue(
        of(alertOf(2, 2, 'CRITICAL', 'ACKNOWLEDGED', '2026-10-04T10:00:00Z')),
      );
      const { harness, element, press } = await open();
      press(primaryActionOf(element));

      harness.fixture.destroy();
      toastOutcome.next('confirmed');

      expect(api.acknowledgeAlert).toHaveBeenCalledWith(2);
    });

    it('closes the time to undo when the person opens that alert', async () => {
      const { harness, element, press } = await open();
      press(primaryActionOf(element));
      const card = Array.from(element.querySelectorAll('app-alert-card')).find((item) =>
        item.textContent?.includes('Cámara fría'),
      )!;

      card.querySelector<HTMLAnchorElement>('h2 a')!.click();
      await harness.fixture.whenStable();

      expect(undoToast.confirmNow).toHaveBeenCalledTimes(1);
    });

    it('leaves the time to undo running when the person opens another alert', async () => {
      const { harness, element, press } = await open();
      press(primaryActionOf(element));
      const anotherCard = Array.from(element.querySelectorAll('app-alert-card')).find((item) =>
        item.textContent?.includes('Device 4'),
      )!;

      anotherCard.querySelector<HTMLAnchorElement>('h2 a')!.click();
      await harness.fixture.whenStable();

      expect(undoToast.confirmNow).not.toHaveBeenCalled();
    });

    it('offers nothing but the detail to who cannot attend alerts', async () => {
      canOperate.set(false);
      const { element } = await open();

      expect(primaryActionOf(element)).toBeNull();
      expect(element.querySelectorAll('app-alert-card .actions a')).toHaveLength(4);
    });
  });

  describe('live refresh', () => {
    const setHidden = (hidden: boolean) =>
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });

    afterEach(() => setHidden(false));

    it('reads the alerts again every 30 seconds', async () => {
      vi.useFakeTimers({
        toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'],
      });
      const opened = open();
      await vi.advanceTimersByTimeAsync(100);
      await opened;
      api.getEnvironmentAlerts.mockClear();

      await vi.advanceTimersByTimeAsync(30_000);

      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(2);
    });

    it('does not read while the tab is hidden, and catches up when it comes back', async () => {
      vi.useFakeTimers({
        toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'],
      });
      const opened = open();
      await vi.advanceTimersByTimeAsync(100);
      await opened;
      api.getEnvironmentAlerts.mockClear();

      setHidden(true);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(api.getEnvironmentAlerts).not.toHaveBeenCalled();

      setHidden(false);
      document.dispatchEvent(new Event('visibilitychange'));
      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(2);
    });

    it('announces the alerts that arrive', async () => {
      const { harness, element, press } = await open();
      answer({
        1: [
          newerCritical,
          attendedCritical,
          alertOf(5, 1, 'WARNING', 'UNRESOLVED', '2026-10-06T10:00:00Z'),
        ],
        2: [olderCritical, warning],
      });

      press(element.querySelector<HTMLButtonElement>('button.refresh')!);
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(liveAnnouncer.announce).toHaveBeenCalledTimes(1);
      expect(element.querySelectorAll('.is-new')).toHaveLength(1);
    });
  });

  describe('detail over the list', () => {
    it('opens over the list, which is not read again and keeps its environment', async () => {
      const { harness, element } = await open('/alerts?environmentId=1');
      api.getEnvironmentAlerts.mockClear();
      const card = element.querySelector('app-alert-card')!;

      card.querySelector<HTMLAnchorElement>('h2 a')!.click();
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(TestBed.inject(Router).url).toMatch(/^\/alerts\/\d+\?environmentId=1$/);
      expect(element.querySelector('.detail-page')).not.toBeNull();
      expect(element.querySelector('app-alert-card')).toBe(card);
      expect(api.getEnvironmentAlerts).not.toHaveBeenCalled();
    });

    it('leaves the messages to the detail while it is open', async () => {
      const { harness, element } = await open('/alerts/2');
      TestBed.inject(CaStore).setError('ca-alerts.errors.failed');
      harness.detectChanges();
      expect(element.querySelector('.feedback')).toBeNull();

      await TestBed.inject(Router).navigateByUrl('/alerts');
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(element.querySelector('.feedback')).not.toBeNull();
    });
  });

  describe('people', () => {
    it('names who attends each alert', async () => {
      answer({
        1: [new DeviationAlert({ ...attendedCritical, acknowledgedBy: 12 })],
        2: [],
      });
      const { element } = await open();
      expect(api.getAlertPeople).toHaveBeenCalledWith(42);
      expect(element.querySelector('app-alert-card .meta')?.textContent).toContain(
        'ca-alerts.active.card.attending-by',
      );
    });
  });

  describe('keyboard shortcuts', () => {
    async function openAttached() {
      const opened = await open();
      document.body.appendChild(opened.element);
      const articles = () =>
        Array.from(opened.element.querySelectorAll<HTMLElement>('app-alert-card article'));
      const press = (target: Element, key: string, init: KeyboardEventInit = {}) => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
        target.dispatchEvent(event);
        opened.harness.detectChanges();
        return event;
      };
      return { ...opened, articles, pressKey: press };
    }

    afterEach(() => document.body.querySelectorAll('app-alert-dashboard').forEach((item) => item.remove()));

    it('moves between the cards with J and K, without leaving the list', async () => {
      const { articles, pressKey } = await openAttached();
      const [first, second] = articles();

      expect(pressKey(first, 'j').defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(second);
      pressKey(second, 'k');
      expect(document.activeElement).toBe(first);

      pressKey(first, 'k');
      expect(document.activeElement).toBe(first);
      const last = articles().at(-1)!;
      last.focus();
      pressKey(last, 'j');
      expect(document.activeElement).toBe(last);
    });

    it('understands the keys with capital letters', async () => {
      const { articles, pressKey } = await openAttached();
      pressKey(articles()[0], 'J');
      expect(document.activeElement).toBe(articles()[1]);
    });

    it('attends the alert that has the focus with A, which can be undone', async () => {
      const { articles, pressKey, countOf } = await openAttached();

      pressKey(articles()[0], 'a');

      expect(undoToast.open).toHaveBeenCalledTimes(1);
      expect(countOf('ca-alerts.active.filters.attending')).toBe('2');
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('does not attend an alert somebody already attends', async () => {
      const { articles, pressKey, element } = await openAttached();
      const attended = articles().find((article) =>
        article.textContent?.includes('ca-alerts.active.card.resolve'),
      )!;
      expect(element.contains(attended)).toBe(true);

      pressKey(attended, 'a');

      expect(undoToast.open).not.toHaveBeenCalled();
    });

    it('does not attend for who cannot do it', async () => {
      canOperate.set(false);
      const { articles, pressKey } = await openAttached();

      pressKey(articles()[0], 'a');

      expect(undoToast.open).not.toHaveBeenCalled();
    });

    it('leaves alone the keys of the browser and any other key', async () => {
      const { articles, pressKey } = await openAttached();
      const [first] = articles();

      expect(pressKey(first, 'j', { ctrlKey: true }).defaultPrevented).toBe(false);
      expect(pressKey(first, 'a', { metaKey: true }).defaultPrevented).toBe(false);
      expect(pressKey(first, 'x').defaultPrevented).toBe(false);
      expect(undoToast.open).not.toHaveBeenCalled();
    });

    it('does nothing outside the list, for example while searching', async () => {
      const { element, pressKey } = await openAttached();

      pressKey(element.querySelector('input')!, 'a');

      expect(undoToast.open).not.toHaveBeenCalled();
    });
  });
});
