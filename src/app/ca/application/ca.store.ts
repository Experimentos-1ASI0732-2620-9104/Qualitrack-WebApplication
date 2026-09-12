import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry, Subject, takeUntil } from 'rxjs';

import { AlertSeverity, AlertStatus, DeviationAlert } from '../domain/model/deviation-alert.entity';
import { ComplianceEvent } from '../domain/model/compliance-event.entity';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { CaApi } from '../infrastructure/ca-api';
import { UpdateNotificationPreferenceRequest } from '../infrastructure/notification-preference.request';
import { AcknowledgeAlertRequest } from '../infrastructure/acknowledge-alert.request';
import { ResolveAlertRequest } from '../infrastructure/resolve-alert.request';

/**
 * Application store for managing Compliance and Alerts (CA) state.
 *
 * @remarks
 * This store acts as the central state management for the CA domain, using Angular Signals
 * for reactive data flow. It encapsulates business logic for the application layer,
 * coordinating between the infrastructure layer (API) and the presentation layer (Components).
 *
 * It manages state for:
 * - Deviation alerts and their statistics.
 * - Compliance audit events.
 * - User notification preferences.
 */
@Injectable({ providedIn: 'root' })
export class CaStore {
  private readonly _alertsSignal = signal<DeviationAlert[]>([]);
  private readonly _selectedAlertSignal = signal<DeviationAlert | null>(null);
  private readonly _eventsSignal = signal<ComplianceEvent[]>([]);
  private readonly _preferenceSignal = signal<NotificationPreference | null>(null);

  private readonly _loadingSignal = signal<boolean>(false);
  private readonly _errorSignal = signal<string | null>(null);

  /**
   * Read-only signal providing the current list of deviation alerts.
   */
  readonly alerts = this._alertsSignal.asReadonly();

  /**
   * Read-only signal providing the currently selected deviation alert.
   */
  readonly selectedAlert = this._selectedAlertSignal.asReadonly();

  /**
   * Read-only signal providing the current list of compliance audit events.
   */
  readonly complianceEvents = this._eventsSignal.asReadonly();

  /**
   * Read-only signal providing the current user notification preferences.
   */
  readonly preference = this._preferenceSignal.asReadonly();

  /**
   * Read-only signal indicating if an asynchronous operation is in progress.
   */
  readonly loading = this._loadingSignal.asReadonly();

  /**
   * Read-only signal containing the current error message, if any.
   */
  readonly error = this._errorSignal.asReadonly();

  /**
   * Computed signal for the total number of alerts in the store.
   */
  readonly alertsCount = computed(() => this.alerts().length);

  /**
   * Computed signal for the count of alerts with 'UNRESOLVED' status.
   */
  readonly unresolvedAlertsCount = computed(
    () => this.alerts().filter((alert) => alert.status === 'UNRESOLVED').length,
  );

  /**
   * Computed signal for the count of alerts classified with 'CRITICAL' severity.
   */
  readonly criticalAlertsCount = computed(
    () => this.alerts().filter((alert) => alert.severity === 'CRITICAL').length,
  );

  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadAlerts = new Subject<void>();
  private readonly reloadAlert = new Subject<void>();

  /**
   * Creates an instance of CaStore.
   *
   * @param caApi - Infrastructure service for CA domain API communication.
   */
  constructor(private caApi: CaApi) {}

  /**
   * Retrieves a specific alert by its unique numeric identifier.
   *
   * @param id - The unique numeric identifier of the deviation alert.
   * @returns A computed signal that evaluates to the found alert or undefined.
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
   * Fetches deviation alerts from the API based on optional filters.
   *
   * @param filters - Optional criteria to filter alerts.
   */
  loadAlerts(filters?: {
    equipmentId?: number;
    batchId?: number;
    status?: AlertStatus;
    severity?: AlertSeverity;
  }): void {
    this.reloadAlerts.next();
    this._alertsSignal.set([]);
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getAlerts(filters)
      .pipe(takeUntil(this.reloadAlerts), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alerts) => {
          this._alertsSignal.set(alerts);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(this.formatError(err, 'Failed to load deviation alerts'));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Fetches a specific deviation alert by its unique numeric identifier.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   */
  loadAlertById(alertId: number): void {
    if (!alertId) return;
    this.reloadAlert.next();
    this._selectedAlertSignal.set(null);
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getAlertById(alertId)
      .pipe(takeUntil(this.reloadAlert), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alert) => {
          this.replaceAlert(alert);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(this.formatError(err, `Failed to load deviation alert ${alertId}`));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Acknowledges a deviation alert and updates local state.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   * @param request - DTO containing the user acknowledging the alert.
   */
  acknowledgeAlert(alertId: number, request: AcknowledgeAlertRequest): void {
    if (!alertId) return;

    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .acknowledgeAlert(alertId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedAlert) => {
          this.replaceAlert(updatedAlert);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(this.formatError(err, 'Failed to acknowledge deviation alert'));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Resolves a deviation alert and updates local state.
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   * @param request - DTO containing the user and resolution notes.
   */
  resolveAlert(alertId: number, request: ResolveAlertRequest): void {
    if (!alertId) return;

    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .resolveAlert(alertId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedAlert) => {
          this.replaceAlert(updatedAlert);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(this.formatError(err, 'Failed to resolve deviation alert'));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Fetches compliance events related to a specific domain entity.
   *
   * @param entityId - The unique numeric identifier of the entity to audit.
   */
  loadEquipmentComplianceEvents(equipmentId: number): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getEquipmentComplianceEvents(equipmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this._eventsSignal.set(events);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(this.formatError(err, `Failed to load events for equipment ${equipmentId}`));
          this._loadingSignal.set(false);
        },
      });
  }

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
          this._errorSignal.set(this.formatError(err, `Failed to load events for batch ${batchId}`));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Fetches notification preferences for a specific user.
   *
   * @param userId - The unique numeric identifier of the user.
   */
  loadNotificationPreferences(userId: number): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getPreferences(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preference) => {
          this._preferenceSignal.set(preference);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(this.formatError(err, 'Failed to load notification preferences'));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Updates notification preferences and refreshes the local state.
   *
   * @param userId - The unique numeric identifier of the user.
   * @param request - DTO containing the updated preference values.
   */
  updateNotificationPreferences(
    userId: number,
    request: UpdateNotificationPreferenceRequest,
  ): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .updatePreferences(userId, request)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedPreference) => {
          this._preferenceSignal.set(updatedPreference);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(this.formatError(err, 'Failed to update notification preferences'));
          this._loadingSignal.set(false);
        },
      });
  }

  clearAlerts(): void {
    this.reloadAlerts.next();
    this._alertsSignal.set([]);
    this._loadingSignal.set(false);
  }

  clearError(): void {
    this._errorSignal.set(null);
  }

  setError(message: string): void {
    this._errorSignal.set(message);
  }

  /**
   * Replaces an alert in the local collection and marks it as the selected alert.
   *
   * @param updatedAlert - The latest version of the deviation alert.
   * @private
   */
  private replaceAlert(updatedAlert: DeviationAlert): void {
    this._selectedAlertSignal.set(updatedAlert);

    this._alertsSignal.update((alerts) => {
      const exists = alerts.some((alert) => alert.id === updatedAlert.id);

      if (!exists) {
        return [updatedAlert, ...alerts];
      }

      return alerts.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert));
    });
  }

  /**
   * Formats API error messages for user-friendly display.
   * @private
   */
  private formatError(error: any, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not Found`
        : error.message;
    }
    return fallback;
  }
}
