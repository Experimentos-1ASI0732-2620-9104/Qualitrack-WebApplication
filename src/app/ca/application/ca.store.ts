import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, takeUntil, tap } from 'rxjs';

import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { ComplianceEvent } from '../domain/model/compliance-event.entity';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { CaApi } from '../infrastructure/ca-api';
import { AlertFilters } from '../infrastructure/alert-api-endpoint';
import { UpdateNotificationPreferenceRequest } from '../infrastructure/notification-preference.request';
import { ResolveAlertRequest } from '../infrastructure/resolve-alert.request';
import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../equipment/domain/model/equipment.entity';

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

/**
 * Application store for Compliance & Alerting (CA).
 *
 * @remarks
 * Alerts are read per environment (US85, TS74); the selected alert keeps its detail with the related actions
 * (US86) and is acknowledged (US87) or resolved (US88) by the authenticated user. Operators and quality managers
 * attend alerts; auditors only consult them (decision of 2026-10-04).
 *
 * Every load replaces the previous state of what it loads, and a new request cancels the one in progress for the
 * same data. Failures are kept in {@link CaStore.error} as a translation key or a server detail.
 *
 * @example
 * ```typescript
 * const store = inject(CaStore);
 *
 * store.loadEnvironmentAlerts(environmentId, { active: true });
 * console.log(store.openAlertsCount());
 *
 * store.acknowledgeAlert(alertId);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CaStore {
  private readonly _alertsSignal = signal<DeviationAlert[]>([]);
  private readonly _selectedAlertSignal = signal<DeviationAlert | null>(null);
  private readonly _eventsSignal = signal<ComplianceEvent[]>([]);
  private readonly _preferenceSignal = signal<NotificationPreference | null>(null);
  private readonly _devicesSignal = signal<Equipment[]>([]);

  private readonly _loadingSignal = signal<boolean>(false);
  private readonly _savingSignal = signal<boolean>(false);
  private readonly _errorSignal = signal<string | null>(null);
  private readonly _noticeSignal = signal<string | null>(null);
  private readonly _noticeParamsSignal = signal<Record<string, unknown>>({});

  /** Alerts of the environment currently shown, newest first. */
  readonly alerts = this._alertsSignal.asReadonly();

  /** Alert shown in the detail, with its related actions. */
  readonly selectedAlert = this._selectedAlertSignal.asReadonly();

  /** Compliance audit events of an equipment or batch. */
  readonly complianceEvents = this._eventsSignal.asReadonly();

  /** Notification preferences of the user. */
  readonly preference = this._preferenceSignal.asReadonly();

  /** Equipment and IoT devices of the laboratory, to name the device of each alert. */
  readonly devices = this._devicesSignal.asReadonly();

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

  private readonly destroyRef = inject(DestroyRef);
  private readonly iam = inject(IamStore);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly reloadAlerts = new Subject<void>();
  private readonly reloadAlert = new Subject<void>();

  /**
   * Creates the store.
   *
   * @param caApi - The API facade of Compliance & Alerting
   */
  constructor(private caApi: CaApi) {
    this.canAttend = this.iam.canOperate;
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
        ? selectedAlert
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
    this.equipmentApi
      .getEquipment(this.iam.requireLaboratoryId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (devices) => this._devicesSignal.set(devices), error: () => this._devicesSignal.set([]) });
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
   * Loads an alert with its origin and the actions related to the incident (US86).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   *
   * @remarks
   * Does nothing for an empty id. Cancels the request in progress, clears the selected alert and the latest
   * confirmation, and when the alert arrives it also replaces the one of the list.
   */
  loadAlertById(alertId: number): void {
    if (!alertId) return;
    this.reloadAlert.next();
    this._selectedAlertSignal.set(null);
    this._loadingSignal.set(true);
    this._errorSignal.set(null);
    this._noticeSignal.set(null);

    this.caApi
      .getAlertById(alertId)
      .pipe(takeUntil(this.reloadAlert), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alert) => {
          this.replaceAlert(alert);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Registers that the authenticated user attends the alert (US87).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   *
   * @remarks
   * Confirms with `ca-alerts.acknowledged`. Ignored while another acknowledgement or resolution is being saved.
   */
  acknowledgeAlert(alertId: number): void {
    this.attend(alertId, this.caApi.acknowledgeAlert(alertId), 'ca-alerts.acknowledged');
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
    this.attend(alertId, this.caApi.resolveAlert(alertId, request), 'ca-alerts.resolved');
  }

  /**
   * E-mails an open critical alert again to the people of the laboratory who enabled e-mail notices (US84, TS78).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   *
   * @remarks
   * Confirms with `ca-alerts.email.sent`, or with `ca-alerts.email.no-recipients` when nobody enabled e-mail
   * notices; the number of people is kept in {@link CaStore.noticeParams} as `count`. A 502 answer is reported as
   * `ca-alerts.email.failed`. Ignored while something is being saved.
   */
  sendAlertEmailNotification(alertId: number): void {
    if (!alertId || this._savingSignal()) return;
    this._savingSignal.set(true);
    this._errorSignal.set(null);
    this._noticeSignal.set(null);

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
    this._alertsSignal.update((alerts) =>
      alerts.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert)),
    );
  }
}
