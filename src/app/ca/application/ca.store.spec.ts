import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { AlertEnvironment } from '../domain/model/alert-environment.entity';
import { AlertPerson } from '../domain/model/alert-person.entity';
import { AlertStatus, DeviationAlert } from '../domain/model/deviation-alert.entity';
import { CaApi } from '../infrastructure/ca-api';
import { CaStore } from './ca.store';

const alertOf = (id: number, environmentId: number, status: AlertStatus = 'UNRESOLVED') =>
  new DeviationAlert({
    id,
    environmentId,
    equipmentId: 1,
    parameterName: 'TEMPERATURE',
    recordedValue: 10,
    thresholdValue: 8,
    unit: '°C',
    timestamp: '2026-10-01T10:00:00Z',
    severity: 'CRITICAL',
    status,
  });

const environmentOf = (id: number) =>
  new AlertEnvironment({ id, code: `ENV-${id}`, name: `Environment ${id}`, usage: null });

const conflict = () => new ApiError('Already attended', 409);

describe('CaStore', () => {
  const api = {
    getAlertEnvironments: vi.fn(),
    getAlertPeople: vi.fn(),
    getEnvironmentAlerts: vi.fn(),
    acknowledgeAlert: vi.fn(),
    resolveAlert: vi.fn(),
    getAlertById: vi.fn(),
    sendAlertEmailNotification: vi.fn(),
  };
  let signOutTasks: (() => void)[];

  beforeEach(() => {
    signOutTasks = [];
    api.getAlertEnvironments.mockReset().mockReturnValue(of([environmentOf(1), environmentOf(2)]));
    api.getEnvironmentAlerts.mockReset().mockReturnValue(of([]));
    api.getAlertPeople.mockReset();
    api.acknowledgeAlert.mockReset();
    api.resolveAlert.mockReset();
    api.getAlertById.mockReset();
    api.sendAlertEmailNotification.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: CaApi, useValue: api },
        {
          provide: IamStore,
          useValue: {
            canOperate: signal(true),
            currentUserId: signal(27),
            requireLaboratoryId: () => 42,
            beforeSignOut: (task: () => void) => signOutTasks.push(task),
          },
        },
      ],
    });
  });

  async function storeWithEnvironments() {
    const store = TestBed.inject(CaStore);
    await store.loadEnvironments();
    return store;
  }

  /** Answers each environment with its own alerts; a missing environment fails. */
  function answer(alertsByEnvironment: Record<number, DeviationAlert[]>) {
    api.getEnvironmentAlerts.mockImplementation((_laboratoryId: number, environmentId: number) =>
      alertsByEnvironment[environmentId]
        ? of(alertsByEnvironment[environmentId])
        : throwError(() => new Error('unavailable')),
    );
  }

  describe('open alerts', () => {
    it('joins the open alerts of every environment', async () => {
      answer({ 1: [alertOf(10, 1)], 2: [alertOf(20, 2)] });
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(null);

      expect(store.alerts().map((alert) => alert.id)).toEqual([10, 20]);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledWith(42, 1, { active: true });
      expect(api.getEnvironmentAlerts).toHaveBeenCalledWith(42, 2, { active: true });
      expect(store.loading()).toBe(false);
      expect(store.alertsUpdatedAt()).not.toBeNull();
    });

    it('reads only the chosen environment', async () => {
      answer({ 2: [alertOf(20, 2)] });
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(2);

      expect(store.alerts().map((alert) => alert.id)).toEqual([20]);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(1);
    });

    it('names the environment that failed without hiding the alerts of the others', async () => {
      answer({ 1: [alertOf(10, 1)] });
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(null);

      expect(store.alerts().map((alert) => alert.id)).toEqual([10]);
      expect(store.unavailableEnvironmentIds()).toEqual([2]);
    });

    it('does not claim to be updated when no environment answered', async () => {
      answer({});
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(null);

      expect(store.unavailableEnvironmentIds()).toEqual([1, 2]);
      expect(store.alertsUpdatedAt()).toBeNull();
    });

    it('finishes loading when the laboratory has no environments', async () => {
      api.getAlertEnvironments.mockReturnValue(of([]));
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(null);

      expect(store.alerts()).toEqual([]);
      expect(store.loading()).toBe(false);
    });

    it('ignores the answer of the environment left behind', async () => {
      const stale = new Subject<DeviationAlert[]>();
      api.getEnvironmentAlerts.mockReturnValueOnce(stale).mockReturnValue(of([alertOf(20, 2)]));
      const store = await storeWithEnvironments();

      store.loadOpenAlerts(1);
      store.loadOpenAlerts(2);
      stale.next([alertOf(10, 1)]);
      stale.complete();

      expect(store.alerts().map((alert) => alert.id)).toEqual([20]);
    });
  });

  describe('alert history', () => {
    it('joins every alert of every environment, resolved ones included', async () => {
      answer({ 1: [alertOf(10, 1, 'RESOLVED')], 2: [alertOf(20, 2)] });
      const store = await storeWithEnvironments();

      store.loadAlertHistory(null);

      expect(store.alerts().map((alert) => alert.id)).toEqual([10, 20]);
      expect(api.getEnvironmentAlerts).toHaveBeenCalledWith(42, 1, {});
      expect(api.getEnvironmentAlerts).toHaveBeenCalledWith(42, 2, {});
      expect(store.loading()).toBe(false);
    });

    it('reads only the chosen environment and names it when it fails', async () => {
      answer({});
      const store = await storeWithEnvironments();

      store.loadAlertHistory(2);

      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(1);
      expect(store.unavailableEnvironmentIds()).toEqual([2]);
    });
  });

  describe('silent refresh', () => {
    it('keeps the list on screen while it reads', async () => {
      answer({ 1: [alertOf(10, 1)], 2: [] });
      const store = await storeWithEnvironments();
      store.loadOpenAlerts(null);
      const reading = new Subject<DeviationAlert[]>();
      api.getEnvironmentAlerts.mockReturnValue(reading);

      store.refreshOpenAlerts(null);

      expect(store.alerts().map((alert) => alert.id)).toEqual([10]);
      expect(store.loading()).toBe(false);
      expect(store.refreshing()).toBe(true);
    });

    it('tells which alerts are new', async () => {
      answer({ 1: [alertOf(10, 1)], 2: [] });
      const store = await storeWithEnvironments();
      store.loadOpenAlerts(null);
      expect(store.newAlertIds().size).toBe(0);

      answer({ 1: [alertOf(10, 1), alertOf(11, 1)], 2: [] });
      store.refreshOpenAlerts(null);

      expect([...store.newAlertIds()]).toEqual([11]);
      expect(store.refreshing()).toBe(false);
    });

    it('keeps what an environment showed when it stops answering', async () => {
      answer({ 1: [alertOf(10, 1)], 2: [alertOf(20, 2)] });
      const store = await storeWithEnvironments();
      store.loadOpenAlerts(null);

      answer({ 1: [] });
      store.refreshOpenAlerts(null);

      expect(store.alerts().map((alert) => alert.id)).toEqual([20]);
      expect(store.unavailableEnvironmentIds()).toEqual([2]);
    });

    it('does not start over while another refresh is running', async () => {
      const store = await storeWithEnvironments();
      store.loadOpenAlerts(1);
      api.getEnvironmentAlerts.mockClear().mockReturnValue(new Subject());

      store.refreshOpenAlerts(1);
      store.refreshOpenAlerts(1);

      expect(api.getEnvironmentAlerts).toHaveBeenCalledTimes(1);
    });

    it('does not interrupt a load', async () => {
      const store = await storeWithEnvironments();
      api.getEnvironmentAlerts.mockReturnValue(new Subject());
      store.loadOpenAlerts(1);
      api.getEnvironmentAlerts.mockClear();

      store.refreshOpenAlerts(1);

      expect(api.getEnvironmentAlerts).not.toHaveBeenCalled();
      expect(store.loading()).toBe(true);
    });
  });

  describe('attention that can be undone', () => {
    async function storeWithAlert() {
      answer({ 1: [alertOf(10, 1)], 2: [] });
      const store = await storeWithEnvironments();
      store.loadOpenAlerts(null);
      return store;
    }

    const statusOf = (store: CaStore) => store.alerts()[0].status;

    it('shows the alert as attended without telling the platform', async () => {
      const store = await storeWithAlert();

      store.startAttention(10);

      expect(statusOf(store)).toBe('ACKNOWLEDGED');
      expect(store.alerts()[0].acknowledgedBy).toBe(27);
      expect(store.alerts()[0].acknowledgedAt).not.toBeNull();
      expect(store.hasPendingAttention(10)).toBe(true);
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('forgets the attention when it is undone', async () => {
      const store = await storeWithAlert();
      store.startAttention(10);

      store.undoAttention(10);
      store.confirmAttention(10);

      expect(statusOf(store)).toBe('UNRESOLVED');
      expect(store.hasPendingAttention(10)).toBe(false);
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('registers the attention once, however many times it is confirmed', async () => {
      const answerOfPlatform = new Subject<DeviationAlert>();
      api.acknowledgeAlert.mockReturnValue(answerOfPlatform);
      const store = await storeWithAlert();
      store.startAttention(10);

      store.confirmAttention(10);
      store.confirmAttention(10);
      answerOfPlatform.next(alertOf(10, 1, 'ACKNOWLEDGED'));
      answerOfPlatform.complete();
      store.confirmAttention(10);

      expect(api.acknowledgeAlert).toHaveBeenCalledTimes(1);
      expect(statusOf(store)).toBe('ACKNOWLEDGED');
      expect(store.hasPendingAttention(10)).toBe(false);
    });

    it('can no longer be undone once it was sent', async () => {
      api.acknowledgeAlert.mockReturnValue(new Subject());
      const store = await storeWithAlert();
      store.startAttention(10);
      store.confirmAttention(10);

      store.undoAttention(10);

      expect(statusOf(store)).toBe('ACKNOWLEDGED');
      expect(store.hasPendingAttention(10)).toBe(true);
    });

    it('ignores an alert that is not waiting for attention', async () => {
      answer({ 1: [alertOf(10, 1, 'ACKNOWLEDGED')], 2: [] });
      const store = await storeWithEnvironments();
      store.loadOpenAlerts(null);

      store.startAttention(10);

      expect(store.hasPendingAttention(10)).toBe(false);
    });

    it('keeps the attention through a refresh', async () => {
      const store = await storeWithAlert();
      store.startAttention(10);

      store.refreshOpenAlerts(null);

      expect(statusOf(store)).toBe('ACKNOWLEDGED');
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('discards a refresh that started before the platform answered', async () => {
      api.acknowledgeAlert.mockReturnValue(of(alertOf(10, 1, 'ACKNOWLEDGED')));
      const store = await storeWithAlert();
      const staleReading = new Subject<DeviationAlert[]>();
      api.getEnvironmentAlerts.mockReturnValue(staleReading);
      store.startAttention(10);
      store.refreshOpenAlerts(null);

      store.confirmAttention(10);
      staleReading.next([alertOf(10, 1)]);
      staleReading.complete();

      expect(statusOf(store)).toBe('ACKNOWLEDGED');
      expect(store.refreshing()).toBe(false);
    });

    it('takes the alert back and explains why when the platform fails', async () => {
      api.acknowledgeAlert.mockReturnValue(throwError(() => new ApiError('No connection', 0)));
      const store = await storeWithAlert();
      store.startAttention(10);

      store.confirmAttention(10);

      expect(statusOf(store)).toBe('UNRESOLVED');
      expect(store.error()).toBe('ca-alerts.errors.connection');
    });

    it('shows who got there first when another person attended it', async () => {
      api.acknowledgeAlert.mockReturnValue(throwError(conflict));
      api.getAlertById.mockReturnValue(of(alertOf(10, 1, 'ACKNOWLEDGED')));
      const store = await storeWithAlert();
      store.startAttention(10);

      store.confirmAttention(10);

      expect(statusOf(store)).toBe('ACKNOWLEDGED');
      expect(store.error()).toBe('ca-alerts.active.attended-by-another');
      expect(store.hasPendingAttention(10)).toBe(false);
    });

    it('sends what is waiting before the person signs out', async () => {
      api.acknowledgeAlert.mockReturnValue(new Subject());
      const store = await storeWithAlert();
      store.startAttention(10);

      signOutTasks.forEach((task) => task());

      expect(api.acknowledgeAlert).toHaveBeenCalledWith(10);
    });

    it('sends what is waiting when the page goes away, and not again when the window ends', async () => {
      api.acknowledgeAlert.mockReturnValue(new Subject());
      const store = await storeWithAlert();
      store.startAttention(10);

      window.dispatchEvent(new Event('pagehide'));
      store.confirmAttention(10);

      expect(api.acknowledgeAlert).toHaveBeenCalledTimes(1);
    });

    it('sends the attention before reading the detail of the alert', async () => {
      const answerOfPlatform = new Subject<DeviationAlert>();
      api.acknowledgeAlert.mockReturnValue(answerOfPlatform);
      api.getAlertById.mockReturnValue(of(alertOf(10, 1, 'ACKNOWLEDGED')));
      const store = await storeWithAlert();
      store.startAttention(10);

      store.loadAlertById(10);
      expect(api.acknowledgeAlert).toHaveBeenCalledTimes(1);
      expect(api.getAlertById).not.toHaveBeenCalled();

      answerOfPlatform.next(alertOf(10, 1, 'ACKNOWLEDGED'));
      answerOfPlatform.complete();
      expect(api.getAlertById).toHaveBeenCalledWith(10);
      expect(store.selectedAlert()?.status).toBe('ACKNOWLEDGED');
    });

    it('sends the attention when the alert is e-mailed', async () => {
      api.acknowledgeAlert.mockReturnValue(of(alertOf(10, 1, 'ACKNOWLEDGED')));
      api.sendAlertEmailNotification.mockReturnValue(of({ recipients: 2 }));
      const store = await storeWithAlert();
      store.startAttention(10);

      store.sendAlertEmailNotification(10);

      expect(api.acknowledgeAlert).toHaveBeenCalledWith(10);
      expect(store.notice()).toBe('ca-alerts.email.sent');
    });

    it('leaves the alert of the detail alone when another alert is registered', async () => {
      api.getAlertById.mockReturnValue(of(alertOf(99, 1)));
      api.acknowledgeAlert.mockReturnValue(of(alertOf(10, 1, 'ACKNOWLEDGED')));
      const store = await storeWithAlert();
      store.loadAlertById(99);
      store.startAttention(10);

      store.confirmAttention(10);

      expect(store.selectedAlert()?.id).toBe(99);
    });
  });

  describe('people', () => {
    it('names the people of the laboratory once they are read', () => {
      api.getAlertPeople.mockReturnValue(of([new AlertPerson({ id: 12, name: 'Billy Ruiz' })]));
      const store = TestBed.inject(CaStore);
      expect(store.personName(12)).toBeNull();

      store.loadPeople();

      expect(api.getAlertPeople).toHaveBeenCalledWith(42);
      expect(store.personName(12)).toBe('Billy Ruiz');
      expect(store.personName(13)).toBeNull();
      expect(store.personName(null)).toBeNull();
    });
  });

  describe('detail of an alert', () => {
    it('leaves the list on screen while the detail is read', async () => {
      const detail = new Subject<DeviationAlert>();
      api.getAlertById.mockReturnValue(detail);
      answer({ 1: [alertOf(10, 1)], 2: [] });
      const store = await storeWithEnvironments();
      store.loadOpenAlerts(null);

      store.loadAlertById(10);

      expect(store.loading()).toBe(false);
      expect(store.selectedAlertLoading()).toBe(true);
      expect(store.alerts().map((alert) => alert.id)).toEqual([10]);
      expect(store.getAlertById(10)()?.id).toBe(10);

      detail.next(alertOf(10, 1));
      expect(store.selectedAlertLoading()).toBe(false);
    });

    it('forgets the alert and stops reading it when the detail closes', async () => {
      const detail = new Subject<DeviationAlert>();
      api.getAlertById.mockReturnValue(detail);
      const store = await storeWithEnvironments();
      store.loadAlertById(10);

      store.clearSelectedAlert();
      detail.next(alertOf(10, 1));

      expect(store.selectedAlert()).toBeNull();
      expect(store.selectedAlertLoading()).toBe(false);
    });

    it('registers attention on an alert only known by its detail, as when it comes from a link', async () => {
      api.getAlertById.mockReturnValue(of(alertOf(10, 1)));
      const store = await storeWithEnvironments();
      store.loadAlertById(10);

      store.startAttention(10);

      expect(store.getAlertById(10)()?.status).toBe('ACKNOWLEDGED');
      expect(store.getAlertById(10)()?.acknowledgedBy).toBe(27);
      expect(api.acknowledgeAlert).not.toHaveBeenCalled();
    });

    it('keeps the actions of the detail when the attention reaches the platform', async () => {
      const actuations = [
        { id: 1, action: 'FAN_ON', triggerState: null, result: 'EXECUTED', occurredAt: '' },
      ];
      api.getAlertById.mockReturnValue(
        of(new DeviationAlert({ ...alertOf(10, 1), relatedActuations: actuations })),
      );
      api.acknowledgeAlert.mockReturnValue(of(alertOf(10, 1, 'ACKNOWLEDGED')));
      const store = await storeWithEnvironments();
      store.loadAlertById(10);
      store.startAttention(10);

      store.confirmAttention(10);

      expect(store.getAlertById(10)()?.status).toBe('ACKNOWLEDGED');
      expect(store.getAlertById(10)()?.relatedActuations).toEqual(actuations);
    });

    it('shows the detail as it is when another person got there first', async () => {
      api.getAlertById.mockReturnValue(of(alertOf(10, 1)));
      api.acknowledgeAlert.mockReturnValue(throwError(conflict));
      const store = await storeWithEnvironments();
      store.loadAlertById(10);
      store.startAttention(10);
      api.getAlertById.mockReturnValue(of(alertOf(10, 1, 'ACKNOWLEDGED')));

      store.confirmAttention(10);

      expect(store.error()).toBe('ca-alerts.active.attended-by-another');
      expect(store.getAlertById(10)()?.status).toBe('ACKNOWLEDGED');
    });

    it('resolves only after the attention waiting on the alert was answered', async () => {
      const attention = new Subject<DeviationAlert>();
      api.getAlertById.mockReturnValue(of(alertOf(10, 1)));
      api.acknowledgeAlert.mockReturnValue(attention);
      api.resolveAlert.mockReturnValue(of(alertOf(10, 1, 'RESOLVED')));
      const store = await storeWithEnvironments();
      store.loadAlertById(10);
      store.startAttention(10);

      store.resolveAlert(10, { resolutionNotes: 'Filter replaced' });
      expect(api.resolveAlert).not.toHaveBeenCalled();
      expect(store.saving()).toBe(true);

      attention.next(alertOf(10, 1, 'ACKNOWLEDGED'));
      attention.complete();

      expect(api.resolveAlert).toHaveBeenCalledWith(10, { resolutionNotes: 'Filter replaced' });
      expect(store.getAlertById(10)()?.status).toBe('RESOLVED');
      expect(store.notice()).toBe('ca-alerts.resolved');
      expect(store.saving()).toBe(false);
    });
  });
});
