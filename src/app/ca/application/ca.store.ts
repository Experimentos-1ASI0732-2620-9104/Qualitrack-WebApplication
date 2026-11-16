import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  finalize,
  firstValueFrom,
  forkJoin,
  fromEvent,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { ComplianceEvent } from '../domain/model/compliance-event.entity';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { Notification } from '../domain/model/notification.entity';
import { CaApi } from '../infrastructure/ca-api';
import { AlertFilters } from '../infrastructure/alert-api-endpoint';
import { UpdateNotificationPreferenceRequest } from '../infrastructure/notification-preference.request';
import { ResolveAlertRequest } from '../infrastructure/resolve-alert.request';
import { IamStore } from '../../iam/application/iam.store';
import { ApiError, errorStatus } from '../../shared/infrastructure/api-error';
import { EnvironmentPreference } from '../../shared/infrastructure/environment-preference';
import { AlertDevice } from '../domain/model/alert-device.entity';
import { AlertEnvironment } from '../domain/model/alert-environment.entity';

/**
 * Translates failures of the alert views into translation keys, or the server details when they explain a rule.
 *
 * @param error - The failure raised by the API facade
 * @returns A translation key, or the details sent by the server
 *
 * @remarks
 * The first rule that matches wins: status 0 (no connection), 403 (forbidden), 404 (not found), the details of an
 * `ApiError` or of an `HttpErrorResponse`, and finally the generic failure key.
 */
export function alertError(error: unknown): string {
  const status = error instanceof ApiError ? error.status : error instanceof HttpErrorResponse ? error.status : null;
  if (status === 0) return 'ca-alerts.errors.connection';
  if (status === 403) return 'ca-alerts.errors.forbidden';
  if (status === 404) return 'ca-alerts.not-found';
  if (error instanceof ApiError && error.details) return error.details;
  if (error instanceof HttpErrorResponse && (error.error?.details || error.error?.message)) {
    return error.error.details || error.error.message;
  }
  return 'ca-alerts.errors.failed';
}

/** Notifications shown when the bell opens. */
const NOTIFICATION_PANEL_SIZE = 15;

/** Conflict answered by the platform when the alert is no longer waiting for attention. */
const HTTP_CONFLICT = 409;

/** Alerts read from one environment; `alerts` is null when the environment could not be read. */
interface EnvironmentAlertsReading {
  environmentId: number;
  alerts: DeviationAlert[] | null;
}

/** Attention the person already sees on an alert, while the platform has not registered it. */
interface PendingAttention {
  /** When the person registered it. */
  acknowledgedAt: string;
  /** Emits once the request finished, whatever its outcome; null while it can still be undone. */
  settled: Observable<void> | null;
}

/**
 * Application store for Compliance & Alerting (CA).
 *
 * @remarks
 * Alerts are read per environment (US85, TS74); the selected alert keeps its detail with the related actions
 * (US86) and is acknowledged (US87) or resolved (US88) by the authenticated user. Operators and quality managers
 * attend alerts; auditors only consult them (decision of 2026-10-04).
 *
 * The store also keeps the notifications of the signed-in user (US83): the unread count of the bell in the toolbar
 * and the latest notifications of its panel. They are emptied whenever another person signs in.
 *
 * Every load replaces the previous state of what it loads, and a new request cancels the one in progress for the
 * same data. Failures are kept in {@link CaStore.error} as a translation key or a server detail.
 *
 * Registering attention from the inbox can be undone for a few seconds: {@link CaStore.startAttention} shows the
 * alert as attended right away and nothing reaches the platform until {@link CaStore.confirmAttention}. The attention
 * is also sent when the page goes away or the person signs out, so it is never lost.
 *
 * @example
 * ```typescript
 * const store = inject(CaStore);
 *
 * store.loadEnvironmentAlerts(environmentId, { active: true });
 * console.log(store.openAlertsCount());
 *
 * store.startAttention(alertId);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CaStore {
  private readonly _alertsSignal = signal<DeviationAlert[]>([]);
  private readonly _selectedAlertSignal = signal<DeviationAlert | null>(null);
  private readonly _eventsSignal = signal<ComplianceEvent[]>([]);
  private readonly _preferenceSignal = signal<NotificationPreference | null>(null);
  private readonly _devicesSignal = signal<AlertDevice[]>([]);
  private readonly _environmentsSignal = signal<AlertEnvironment[]>([]);
  private readonly _environmentsLoadedSignal = signal(false);

  private readonly _loadingSignal = signal<boolean>(false);
  private readonly _savingSignal = signal<boolean>(false);
  private readonly _errorSignal = signal<string | null>(null);
  private readonly _noticeSignal = signal<string | null>(null);
  private readonly _noticeParamsSignal = signal<Record<string, unknown>>({});
  private readonly _unreadNotificationsSignal = signal(0);
  private readonly _notificationsSignal = signal<Notification[]>([]);
  private readonly _notificationsLoadingSignal = signal(false);
  private readonly _notificationsFailedSignal = signal(false);
  private readonly _unavailableEnvironmentIdsSignal = signal<readonly number[]>([]);
  private readonly _alertsUpdatedAtSignal = signal<Date | null>(null);
  private readonly _newAlertIdsSignal = signal<ReadonlySet<number>>(new Set());
  private readonly _refreshingSignal = signal(false);
  private readonly _pendingAttentionsSignal = signal<ReadonlyMap<number, PendingAttention>>(new Map());
  private readonly _selectedAlertLoadingSignal = signal(false);
  private readonly _peopleSignal = signal<ReadonlyMap<number, string>>(new Map());

  /** Alerts shown, with the attention that is still waiting to reach the platform already applied. */
  readonly alerts = computed(() => {
    const pendingAttentions = this._pendingAttentionsSignal();
    const alerts = this._alertsSignal();
    return pendingAttentions.size
      ? alerts.map((alert) => this.withPendingAttention(alert, pendingAttentions.get(alert.id)))
      : alerts;
  });

  /** Whether the detail of an alert is being read; the list behind it stays as it is. */
  readonly selectedAlertLoading = this._selectedAlertLoadingSignal.asReadonly();

  /** Environments whose open alerts could not be read in the latest load; what they showed before is kept. */
  readonly unavailableEnvironmentIds = this._unavailableEnvironmentIdsSignal.asReadonly();

  /** When the open alerts were read for the last time, or null if they were not read yet. */
  readonly alertsUpdatedAt = this._alertsUpdatedAtSignal.asReadonly();

  /** Alerts that the latest refresh brought and the list did not have. */
  readonly newAlertIds = this._newAlertIdsSignal.asReadonly();

  /** Whether the open alerts are being read again while the list stays on screen. */
  readonly refreshing = this._refreshingSignal.asReadonly();

  /** Alert shown in the detail, with its related actions. */
  readonly selectedAlert = this._selectedAlertSignal.asReadonly();

  /** Compliance audit events of an equipment or batch. */
  readonly complianceEvents = this._eventsSignal.asReadonly();

  /** Notification preferences of the user. */
  readonly preference = this._preferenceSignal.asReadonly();

  /** Devices of the laboratory, to name the device of each alert. */
  readonly devices = this._devicesSignal.asReadonly();

  /** Environments of the laboratory, to choose whose alerts are shown. */
  readonly environments = this._environmentsSignal.asReadonly();

  /** Whether the environments have been read at least once. */
  readonly environmentsLoaded = this._environmentsLoadedSignal.asReadonly();

  /** Whether the laboratory has no environment yet. */
  readonly environmentsEmpty = computed(() => this._environmentsLoadedSignal() && this._environmentsSignal().length === 0);

  /** Indicates whether alerts, events, preferences or an alert detail are being loaded. */
  readonly loading = this._loadingSignal.asReadonly();

  /** Indicates whether an acknowledgement or resolution is being registered. */
  readonly saving = this._savingSignal.asReadonly();

  /** Latest error as a translation key or server detail. */
  readonly error = this._errorSignal.asReadonly();

  /** Latest confirmation as a translation key. */
  readonly notice = this._noticeSignal.asReadonly();

  /** Values of the latest confirmation, for example how many people an alert was e-mailed to. */
  readonly noticeParams = this._noticeParamsSignal.asReadonly();

  /** Open alerts (unresolved or being attended) of the list. */
  readonly openAlertsCount = computed(() => this.alerts().filter((alert) => alert.isOpen).length);

  /** Open critical alerts of the list. */
  readonly criticalAlertsCount = computed(
    () => this.alerts().filter((alert) => alert.isOpen && alert.severity === 'CRITICAL').length,
  );

  /** Open alerts somebody is already attending. */
  readonly acknowledgedAlertsCount = computed(
    () => this.alerts().filter((alert) => alert.status === 'ACKNOWLEDGED').length,
  );

  /** Whether the user can attend alerts: signed in and not only an auditor. */
  readonly canAttend: Signal<boolean>;

  /** Notifications the person has not read. */
  readonly unreadNotifications = this._unreadNotificationsSignal.asReadonly();

  /** Latest notifications, newest first. */
  readonly notifications = this._notificationsSignal.asReadonly();

  /** Whether the latest notifications are being loaded. */
  readonly notificationsLoading = this._notificationsLoadingSignal.asReadonly();

  /** Whether the latest notifications could not be loaded. */
  readonly notificationsFailed = this._notificationsFailedSignal.asReadonly();

  /** Whether the person has at least one unread notification. */
  readonly hasUnreadNotifications = computed(() => this.unreadNotifications() > 0);

  private readonly destroyRef = inject(DestroyRef);
  private readonly iam = inject(IamStore);
  private readonly reloadAlerts = new Subject<void>();
  private readonly reloadAlert = new Subject<void>();
  /** Stops a refresh that started before an alert changed, because it would bring the alert back as it was. */
  private readonly discardRefresh = new Subject<void>();
  /** Environment opened last time in the monitoring views of this browser, shared with Tracking. */
  private readonly environmentPreference = new EnvironmentPreference('tracking');

  /**
   * Creates the store.
   *
   * @remarks
   * An effect watches the signed-in user and empties the notification count and list whenever it changes, so that
   * nothing of a previous person is shown to the next one.
   *
   * @param caApi - The API facade of Compliance & Alerting
   */
  constructor(private caApi: CaApi) {
    this.canAttend = this.iam.canOperate;
    effect(() => {
      this.iam.currentUserId();
      this._unreadNotificationsSignal.set(0);
      this._notificationsSignal.set([]);
      this._peopleSignal.set(new Map());
    });
    this.iam.beforeSignOut(() => this.sendPendingAttentions());
    fromEvent(inject(DOCUMENT).defaultView!, 'pagehide')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sendPendingAttentions());
  }

  /**
   * Updates the count of the bell; a failure keeps the last count.
   *
   * @returns Observable emitting the new unread count, or the last known one if the request failed. It never errors.
   */
  refreshUnreadNotifications(): Observable<number> {
    return this.caApi.getUnreadNotificationCount().pipe(
      tap((count) => this._unreadNotificationsSignal.set(count)),
      catchError(() => of(this._unreadNotificationsSignal())),
    );
  }

  /**
   * Loads the latest notifications for the panel of the bell and refreshes the unread count.
   */
  loadLatestNotifications(): void {
    this._notificationsLoadingSignal.set(true);
    this._notificationsFailedSignal.set(false);
    this.caApi.getNotifications(false, NOTIFICATION_PANEL_SIZE).pipe(
      finalize(() => this._notificationsLoadingSignal.set(false)),
    ).subscribe({
      next: (notifications) => {
        this._notificationsSignal.set(notifications);
        this.refreshUnreadNotifications().subscribe();
      },
      error: () => this._notificationsFailedSignal.set(true),
    });
  }

  /**
   * Marks one notification as read.
   *
   * @param notification - The notification the person opened
   */
  markNotificationAsRead(notification: Notification): void {
    if (notification.isRead) return;
    this.caApi.markNotificationAsRead(notification.id).subscribe({
      next: (read) => {
        this._notificationsSignal.update((current) => current.map((item) => item.id === read.id ? read : item));
        this._unreadNotificationsSignal.update((count) => Math.max(0, count - 1));
      },
    });
  }

  /**
   * Marks every notification of the person as read.
   */
  markAllNotificationsAsRead(): void {
    this.caApi.markAllNotificationsAsRead().subscribe({
      next: () => {
        const readAt = new Date().toISOString();
        this._notificationsSignal.update((current) => current.map((item) =>
          item.isRead ? item : new Notification({ ...item, readAt })));
        this._unreadNotificationsSignal.set(0);
      },
    });
  }

  /**
   * The alert shown by the detail, or one of the listed alerts.
   *
   * @param id - The unique numeric identifier of the deviation alert.
   * @returns A signal with the selected alert when it has that id, otherwise the listed alert with that id, or
   * `undefined` when there is none
   */
  getAlertById(id: number): Signal<DeviationAlert | undefined> {
    return computed(() => {
      const selectedAlert = this.selectedAlert();

      return selectedAlert?.id === id
        ? this.withPendingAttention(selectedAlert, this._pendingAttentionsSignal().get(id))
        : this.alerts().find((alert) => alert.id === id);
    });
  }

  /**
   * Name of the device or equipment of an alert, or null while it is unknown.
   *
   * @param equipmentId - The equipment or device that detected the deviation
   * @returns The name, or `null` when the equipment is not among the loaded devices
   */
  deviceName(equipmentId: number): string | null {
    return this.devices().find((device) => device.id === equipmentId)?.name ?? null;
  }

  /**
   * Loads the equipment of the laboratory once, to show the name of the device of each alert.
   *
   * @throws {Error} When the user has no laboratory set up
   *
   * @remarks
   * Does nothing when the equipment is already loaded. If the request fails, the list stays empty.
   */
  loadDevices(): void {
    if (this._devicesSignal().length) return;
    this.caApi
      .getAlertDevices(this.iam.requireLaboratoryId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (devices) => this._devicesSignal.set(devices), error: () => this._devicesSignal.set([]) });
  }

  /**
   * Name of a person of the laboratory, or null while it is unknown.
   *
   * @param userId - The account of the person
   * @returns The name, or `null` when there is no account or it is not among the loaded people
   */
  personName(userId: number | null): string | null {
    return userId === null ? null : (this._peopleSignal().get(userId) ?? null);
  }

  /**
   * Reads the people of the laboratory, so that alerts can name who attended or resolved them.
   *
   * @remarks
   * People join and leave, so it reads them every time it is asked. What was known is kept until the answer arrives.
   */
  loadPeople(): void {
    this.caApi
      .getAlertPeople(this.iam.requireLaboratoryId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((people) =>
        this._peopleSignal.set(new Map(people.map((person) => [person.id, person.name]))),
      );
  }

  /**
   * Reads the environments of the laboratory (Laboratory → Compliance & Alerts).
   *
   * @remarks
   * On failure the previous list is kept and the reason is exposed through {@link CaStore.error}.
   */
  async loadEnvironments(): Promise<void> {
    try {
      this._environmentsSignal.set(await firstValueFrom(this.caApi.getAlertEnvironments(this.iam.requireLaboratoryId())));
      this._environmentsLoadedSignal.set(true);
    } catch (error) {
      this._errorSignal.set(alertError(error));
    }
  }

  /**
   * The environment to open: the last one chosen in the monitoring views of this browser, or the first one.
   *
   * @returns The environment identifier, or null when the laboratory has none
   */
  preferredEnvironmentId(): number | null {
    return this.environmentPreference.choose(this.iam.requireLaboratoryId(), this._environmentsSignal())?.id ?? null;
  }

  /**
   * Remembers the environment the person chose, for the next visit to the monitoring views.
   *
   * @param environmentId - The environment identifier
   */
  rememberEnvironment(environmentId: number): void {
    this.environmentPreference.remember(this.iam.requireLaboratoryId(), environmentId);
  }

  /**
   * Loads the alerts of an environment and its monitored containers (US85, TS74).
   *
   * @param environmentId - The environment
   * @param filters - Optional status, severity, device and active filters
   * @throws {Error} When the user has no laboratory set up
   *
   * @remarks
   * Cancels the request in progress and empties the list before loading.
   */
  loadEnvironmentAlerts(environmentId: number, filters: AlertFilters = {}): void {
    this.reloadAlerts.next();
    this._alertsSignal.set([]);
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getEnvironmentAlerts(this.iam.requireLaboratoryId(), environmentId, filters)
      .pipe(takeUntil(this.reloadAlerts), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alerts) => {
          this._alertsSignal.set(alerts);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Loads the open alerts of one environment or of the whole laboratory, emptying the list first.
   *
   * @param environmentId - The environment, or null for every environment of the laboratory
   * @throws {Error} When the user has no laboratory set up
   *
   * @remarks
   * Cancels the request in progress. An environment that fails does not hide the alerts of the others: it is named
   * in {@link CaStore.unavailableEnvironmentIds}.
   */
  loadOpenAlerts(environmentId: number | null): void {
    this.loadAlerts(environmentId, { active: true });
  }

  /**
   * Loads every alert, open or resolved, of one environment or of the whole laboratory, emptying the list first.
   *
   * @param environmentId - The environment, or null for every environment of the laboratory
   * @throws {Error} When the user has no laboratory set up
   *
   * @remarks
   * Used by the alert history, which filters the alerts in the browser. Like {@link CaStore.loadOpenAlerts}, an
   * environment that fails does not hide the alerts of the others.
   */
  loadAlertHistory(environmentId: number | null): void {
    this.loadAlerts(environmentId, {});
  }

  /**
   * Reads the open alerts again without emptying the list or showing that something is loading.
   *
   * @param environmentId - The environment, or null for every environment of the laboratory
   * @throws {Error} When the user has no laboratory set up
   *
   * @remarks
   * Does nothing while a load or another refresh is running, so a slow network never starts them over. The alerts
   * that were not in the list are kept in {@link CaStore.newAlertIds}.
   */
  refreshOpenAlerts(environmentId: number | null): void {
    if (this._loadingSignal() || this._refreshingSignal()) return;
    this._refreshingSignal.set(true);

    this.readAlerts(environmentId, { active: true })
      .pipe(
        takeUntil(this.reloadAlerts),
        takeUntil(this.discardRefresh),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._refreshingSignal.set(false)),
      )
      .subscribe((readings) => {
        const listedIds = new Set(this._alertsSignal().map((alert) => alert.id));
        this.showAlerts(readings);
        this._newAlertIdsSignal.set(
          new Set(this._alertsSignal().map((alert) => alert.id).filter((id) => !listedIds.has(id))),
        );
      });
  }

  /**
   * Shows an alert as attended by the signed-in user, without telling the platform yet (US87).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   *
   * @remarks
   * Follow it with {@link CaStore.confirmAttention} or {@link CaStore.undoAttention}. Ignored when the listed alert
   * is not waiting for attention.
   */
  startAttention(alertId: number): void {
    if (this.getAlertById(alertId)()?.status !== 'UNRESOLVED') return;
    this._errorSignal.set(null);
    this._noticeSignal.set(null);
    this.setPendingAttention(alertId, { acknowledgedAt: new Date().toISOString(), settled: null });
  }

  /**
   * Forgets an attention that did not reach the platform.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   *
   * @remarks
   * An attention that was already sent can no longer be undone, so the alert stays as attended.
   */
  undoAttention(alertId: number): void {
    if (this._pendingAttentionsSignal().get(alertId)?.settled === null) this.forgetPendingAttention(alertId);
  }

  /**
   * Registers on the platform the attention started on an alert.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   *
   * @remarks
   * Calling it again does nothing. If the platform refuses, the alert goes back to how it was and the reason stays in
   * {@link CaStore.error}; a conflict means another person got there first, so the alert is read again.
   */
  confirmAttention(alertId: number): void {
    this.sendAttention(alertId);
  }

  /**
   * Whether an attention started on an alert has not reached the platform.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   * @returns `true` from {@link CaStore.startAttention} until the platform answers or the attention is undone
   */
  hasPendingAttention(alertId: number): boolean {
    return this._pendingAttentionsSignal().has(alertId);
  }

  /**
   * Loads an alert with its origin and the actions related to the incident (US86).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   *
   * @remarks
   * Does nothing for an empty id. Cancels the request in progress, clears the selected alert and the latest
   * confirmation, and when the alert arrives it also replaces the one of the list. An attention waiting on this alert
   * is sent first, so the detail never shows the alert as it was before it.
   */
  loadAlertById(alertId: number): void {
    if (!alertId) return;
    this.reloadAlert.next();
    this._selectedAlertSignal.set(null);
    this._selectedAlertLoadingSignal.set(true);
    this._errorSignal.set(null);
    this._noticeSignal.set(null);

    this.sendAttention(alertId)
      .pipe(
        switchMap(() => this.caApi.getAlertById(alertId)),
        takeUntil(this.reloadAlert),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (alert) => {
          this.replaceAlert(alert);
          this._selectedAlertLoadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._selectedAlertLoadingSignal.set(false);
        },
      });
  }

  /**
   * Forgets the alert whose detail was open, stopping its reading if it did not finish.
   *
   * @remarks
   * Its failures go with it, but a confirmation stays, because it tells what just happened to whoever is back on the list.
   */
  clearSelectedAlert(): void {
    this.reloadAlert.next();
    this._selectedAlertSignal.set(null);
    this._selectedAlertLoadingSignal.set(false);
    this._errorSignal.set(null);
  }

  /**
   * Registers the resolution of the alert by the authenticated user (US88).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   * @param request - DTO containing the resolution notes.
   *
   * @remarks
   * Confirms with `ca-alerts.resolved`. Ignored while another acknowledgement or resolution is being saved.
   */
  resolveAlert(alertId: number, request: ResolveAlertRequest): void {
    this.attend(
      alertId,
      this.sendAttention(alertId).pipe(switchMap(() => this.caApi.resolveAlert(alertId, request))),
      'ca-alerts.resolved',
    );
  }

  /**
   * E-mails an open critical alert again to the people of the laboratory who enabled e-mail notices (US84, TS78).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   *
   * @remarks
   * Confirms with `ca-alerts.email.sent`, or with `ca-alerts.email.no-recipients` when nobody enabled e-mail
   * notices; the number of people is kept in {@link CaStore.noticeParams} as `count`. A 502 answer is reported as
   * `ca-alerts.email.failed`. Ignored while something is being saved. An attention waiting on this alert is sent too.
   */
  sendAlertEmailNotification(alertId: number): void {
    if (!alertId || this._savingSignal()) return;
    this._savingSignal.set(true);
    this._errorSignal.set(null);
    this._noticeSignal.set(null);
    this.sendAttention(alertId);

    this.caApi.sendAlertEmailNotification(alertId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (delivery) => {
        this._noticeParamsSignal.set({ count: delivery.recipients });
        this._noticeSignal.set(delivery.recipients === 0 ? 'ca-alerts.email.no-recipients' : 'ca-alerts.email.sent');
        this._savingSignal.set(false);
      },
      error: (err) => {
        this._errorSignal.set(err instanceof ApiError && err.status === 502 ? 'ca-alerts.email.failed' : alertError(err));
        this._savingSignal.set(false);
      },
    });
  }

  /**
   * Fetches compliance events related to an equipment.
   *
   * @param equipmentId - The unique numeric identifier of the equipment.
   * @throws {Error} When the user has no laboratory set up
   */
  loadEquipmentComplianceEvents(equipmentId: number): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getEquipmentComplianceEvents(this.iam.requireLaboratoryId(), equipmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this._eventsSignal.set(events);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Fetches compliance events related to a batch.
   *
   * @param batchId - The unique numeric identifier of the batch.
   */
  loadBatchComplianceEvents(batchId: number): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getBatchComplianceEvents(batchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this._eventsSignal.set(events);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Fetches the notification preferences of the signed-in user.
   */
  loadNotificationPreferences(): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getPreferences()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preference) => {
          this._preferenceSignal.set(preference);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Updates the notification preferences of the signed-in user and keeps them as the local state.
   *
   * @param request - DTO containing the updated preference values.
   * @returns The saved preferences; the caller shows the confirmation or the error.
   */
  updateNotificationPreferences(request: UpdateNotificationPreferenceRequest): Observable<NotificationPreference> {
    return this.caApi.updatePreferences(request).pipe(
      tap((updatedPreference) => this._preferenceSignal.set(updatedPreference)),
    );
  }

  /** Cancels the alerts request in progress and empties the list. */
  clearAlerts(): void {
    this.reloadAlerts.next();
    this._alertsSignal.set([]);
    this._newAlertIdsSignal.set(new Set());
    this._unavailableEnvironmentIdsSignal.set([]);
    this._alertsUpdatedAtSignal.set(null);
    this._loadingSignal.set(false);
  }

  /** Clears the latest error and the latest confirmation. */
  clearError(): void {
    this._errorSignal.set(null);
    this._noticeSignal.set(null);
  }

  /**
   * Shows an error raised outside the store.
   *
   * @param message - A translation key or a text to show
   */
  setError(message: string): void {
    this._errorSignal.set(message);
  }

  /**
   * Runs an acknowledgement or a resolution and keeps its result as the selected alert.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   * @param request - The request that registers the operation
   * @param notice - Translation key of the confirmation to show when it succeeds
   *
   * @remarks
   * Ignored for an empty id or while another operation is being saved. The response does not repeat the actions
   * related to the incident, so those of the selected alert are kept.
   */
  private attend(alertId: number, request: ReturnType<CaApi['acknowledgeAlert']>, notice: string): void {
    if (!alertId || this._savingSignal()) return;
    this._savingSignal.set(true);
    this._errorSignal.set(null);
    this._noticeSignal.set(null);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updatedAlert) => {
        // The acknowledgement and resolution responses do not repeat the related actions of the detail.
        const current = this._selectedAlertSignal();
        if (current?.id === updatedAlert.id) updatedAlert.relatedActuations = current.relatedActuations;
        this.replaceAlert(updatedAlert);
        this._noticeSignal.set(notice);
        this._savingSignal.set(false);
      },
      error: (err) => {
        this._errorSignal.set(alertError(err));
        this._savingSignal.set(false);
      },
    });
  }

  /**
   * Replaces an alert in the local collection and marks it as the selected alert.
   *
   * @param updatedAlert - The latest version of the deviation alert.
   */
  private replaceAlert(updatedAlert: DeviationAlert): void {
    this._selectedAlertSignal.set(updatedAlert);
    this.replaceListedAlert(updatedAlert);
  }

  /**
   * Replaces an alert in the local collection, leaving the selected alert as it is.
   *
   * @param updatedAlert - The latest version of the deviation alert.
   */
  private replaceListedAlert(updatedAlert: DeviationAlert): void {
    this.discardRefresh.next();
    this._alertsSignal.update((alerts) =>
      alerts.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert)),
    );
  }

  /**
   * Empties the list and loads the alerts of one environment or of the whole laboratory that match the filters.
   *
   * @param environmentId - The environment, or null for every environment of the laboratory
   * @param filters - What the platform filters, the same for every environment
   *
   * @remarks
   * Cancels the request in progress.
   */
  private loadAlerts(environmentId: number | null, filters: AlertFilters): void {
    this.reloadAlerts.next();
    this._alertsSignal.set([]);
    this._newAlertIdsSignal.set(new Set());
    this._unavailableEnvironmentIdsSignal.set([]);
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.readAlerts(environmentId, filters)
      .pipe(takeUntil(this.reloadAlerts), takeUntilDestroyed(this.destroyRef))
      .subscribe((readings) => {
        this.showAlerts(readings);
        this._loadingSignal.set(false);
      });
  }

  /**
   * Reads the alerts of each environment asked for, without letting one failure stop the others.
   *
   * @param environmentId - The environment, or null for every environment of the laboratory
   * @param filters - What the platform filters, the same for every environment
   * @returns Observable emitting one reading per environment; it never errors
   */
  private readAlerts(environmentId: number | null, filters: AlertFilters): Observable<EnvironmentAlertsReading[]> {
    const environmentIds =
      environmentId === null ? this._environmentsSignal().map((environment) => environment.id) : [environmentId];
    if (!environmentIds.length) return of([]);
    const laboratoryId = this.iam.requireLaboratoryId();
    return forkJoin(
      environmentIds.map((id) =>
        this.caApi.getEnvironmentAlerts(laboratoryId, id, filters).pipe(
          map((alerts): EnvironmentAlertsReading => ({ environmentId: id, alerts })),
          catchError(() => of<EnvironmentAlertsReading>({ environmentId: id, alerts: null })),
        ),
      ),
    );
  }

  /**
   * Replaces the list with what was read, keeping what was shown of the environments that could not be read.
   *
   * @param readings - One reading per environment
   */
  private showAlerts(readings: EnvironmentAlertsReading[]): void {
    const unavailableIds = readings.filter(({ alerts }) => alerts === null).map(({ environmentId }) => environmentId);
    const keptAlerts = this._alertsSignal().filter(
      (alert) => alert.environmentId !== null && unavailableIds.includes(alert.environmentId),
    );
    this._alertsSignal.set([...readings.flatMap(({ alerts }) => alerts ?? []), ...keptAlerts]);
    this._unavailableEnvironmentIdsSignal.set(unavailableIds);
    if (unavailableIds.length < readings.length || !readings.length) this._alertsUpdatedAtSignal.set(new Date());
  }

  /**
   * Shows an alert as attended while its attention has not reached the platform.
   *
   * @param alert - The alert as the platform last sent it
   * @param pendingAttention - The attention waiting on the alert, if any
   * @returns The alert to show
   *
   * @remarks
   * If the alert is no longer waiting for attention, what the platform says wins.
   */
  private withPendingAttention(alert: DeviationAlert, pendingAttention?: PendingAttention): DeviationAlert {
    if (!pendingAttention || alert.status !== 'UNRESOLVED') return alert;
    return new DeviationAlert({
      ...alert,
      status: 'ACKNOWLEDGED',
      acknowledgedBy: this.iam.currentUserId(),
      acknowledgedAt: pendingAttention.acknowledgedAt,
    });
  }

  /** Sends every attention that is still waiting, while the session and the page are alive. */
  private sendPendingAttentions(): void {
    for (const alertId of this._pendingAttentionsSignal().keys()) this.sendAttention(alertId);
  }

  /**
   * Sends the attention waiting on an alert, once.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   * @returns Observable emitting when the request finished, whatever its outcome, or right away if nothing is waiting
   *
   * @remarks
   * The request starts here, without waiting for anybody to subscribe, so it is sent even if the caller goes away.
   */
  private sendAttention(alertId: number): Observable<void> {
    const pendingAttention = this._pendingAttentionsSignal().get(alertId);
    if (!pendingAttention) return of(undefined);
    if (pendingAttention.settled) return pendingAttention.settled;

    const settled = new ReplaySubject<void>(1);
    this.setPendingAttention(alertId, { ...pendingAttention, settled });
    this.caApi
      .acknowledgeAlert(alertId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.forgetPendingAttention(alertId);
          settled.next();
          settled.complete();
        }),
      )
      .subscribe({
        next: (updatedAlert) => {
          const selectedAlert = this._selectedAlertSignal();
          if (selectedAlert?.id === updatedAlert.id) {
            updatedAlert.relatedActuations = selectedAlert.relatedActuations;
            this._selectedAlertSignal.set(updatedAlert);
          }
          this.replaceListedAlert(updatedAlert);
        },
        error: (error) => this.handleRefusedAttention(alertId, error),
      });
    return settled;
  }

  /**
   * Explains why the platform refused an attention.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   * @param error - The failure raised by the API facade
   */
  private handleRefusedAttention(alertId: number, error: unknown): void {
    if (errorStatus(error) !== HTTP_CONFLICT) {
      this._errorSignal.set(alertError(error));
      return;
    }
    this._errorSignal.set('ca-alerts.active.attended-by-another');
    this.caApi
      .getAlertById(alertId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alert) => {
          if (this._selectedAlertSignal()?.id === alert.id) this._selectedAlertSignal.set(alert);
          this.replaceListedAlert(alert);
        },
      });
  }

  private setPendingAttention(alertId: number, pendingAttention: PendingAttention): void {
    this._pendingAttentionsSignal.update((current) => new Map(current).set(alertId, pendingAttention));
  }

  private forgetPendingAttention(alertId: number): void {
    this._pendingAttentionsSignal.update((current) => {
      const remaining = new Map(current);
      remaining.delete(alertId);
      return remaining;
    });
  }
}
