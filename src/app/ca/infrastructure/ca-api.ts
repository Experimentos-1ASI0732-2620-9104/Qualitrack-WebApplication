import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { AlertApiEndpoint, AlertFilters } from './alert-api-endpoint';
import { ComplianceEventApiEndpoint } from './compliance-event-api-endpoint';
import { NotificationPreferenceApiEndpoint } from './notification-preference-api-endpoint';
import { NotificationApiEndpoint } from './notification-api-endpoint';
import { AlertEmailNotificationResource } from './notification-response';

import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { ComplianceEvent } from '../domain/model/compliance-event.entity';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { Notification } from '../domain/model/notification.entity';
import { UpdateNotificationPreferenceRequest } from './notification-preference.request';
import { ResolveAlertRequest } from './resolve-alert.request';

/**
 * Infrastructure service facade for Compliance and Alerts (CA) external API operations.
 *
 * @remarks
 * In Domain-Driven Design, this service acts as the infrastructure layer facade
 * coordinating access to Compliance-related API resources through HTTP endpoints.
 * It orchestrates interactions between the application layer and the underlying
 * infrastructure endpoints for alerts, events, and user preferences.
 *
 * The CaApi abstracts away the complexity of managing multiple endpoints,
 * providing a unified interface for application services to interact with
 * the compliance domain data.
 *
 * @example
 * ```typescript
 * constructor(private caApi: CaApi) {}
 *
 * loadAlerts() {
 *   this.caApi.getEnvironmentAlerts(laboratoryId, environmentId, { active: true }).subscribe(alerts => {
 *     // Handle critical alerts
 *   });
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CaApi extends BaseApi {
  /**
   * Endpoint client for deviation alert operations.
   * @private
   */
  private readonly _alertEndpoint: AlertApiEndpoint;

  /**
   * Endpoint client for compliance event operations.
   * @private
   */
  private readonly _complianceEventEndpoint: ComplianceEventApiEndpoint;

  /**
   * Endpoint client for notification preference operations.
   * @private
   */
  private readonly _preferenceEndpoint: NotificationPreferenceApiEndpoint;

  /**
   * Endpoint client for the notifications of the signed-in user.
   * @private
   */
  private readonly _notificationEndpoint: NotificationApiEndpoint;

  /**
   * Creates an instance of CaApi.
   *
   * @param http - Angular HttpClient for making HTTP requests
   *
   * @remarks
   * Initializes the API facade with specialized endpoint clients for alerts,
   * compliance events, and notification settings. Each client is responsible
   * for its own resource assembly and HTTP communication.
   */
  constructor(http: HttpClient) {
    super();
    this._alertEndpoint = new AlertApiEndpoint(http);
    this._complianceEventEndpoint = new ComplianceEventApiEndpoint(http);
    this._preferenceEndpoint = new NotificationPreferenceApiEndpoint(http);
    this._notificationEndpoint = new NotificationApiEndpoint(http);
  }

  /**
   * Retrieves the alerts of an environment and its monitored containers (US85, TS74).
   *
   * @param laboratoryId - The laboratory of the environment
   * @param environmentId - The environment
   * @param filters - Optional status, severity, device and active filters
   * @returns Observable stream emitting the alerts, newest first
   */
  getEnvironmentAlerts(laboratoryId: number, environmentId: number, filters?: AlertFilters): Observable<DeviationAlert[]> {
    return this._alertEndpoint.getEnvironmentAlerts(laboratoryId, environmentId, filters);
  }

  /**
   * Retrieves a deviation alert with the actions related to its incident (US86).
   *
   * @param alertId - The unique numeric identifier of the deviation alert
   * @returns Observable stream emitting the DeviationAlert domain entity
   */
  getAlertById(alertId: number): Observable<DeviationAlert> {
    return this._alertEndpoint.getAlertById(alertId);
  }

  /**
   * Acknowledges a deviation alert.
   *
   * @param alertId - The unique numeric identifier of the deviation alert
   * @returns Observable stream emitting the updated DeviationAlert domain entity
   *
   * @remarks
   * Delegates the acknowledgement operation to the alert endpoint client.
   */
  acknowledgeAlert(alertId: number): Observable<DeviationAlert> {
    return this._alertEndpoint.acknowledgeAlert(alertId);
  }

  /**
   * Resolves a deviation alert.
   *
   * @param alertId - The unique numeric identifier of the deviation alert
   * @param request - DTO containing the resolution notes
   * @returns Observable stream emitting the updated DeviationAlert domain entity
   *
   * @remarks
   * Delegates the resolution operation to the alert endpoint client.
   */
  resolveAlert(alertId: number, request: ResolveAlertRequest): Observable<DeviationAlert> {
    return this._alertEndpoint.resolveAlert(alertId, request);
  }

  /**
   * E-mails an open critical alert again to the people of the laboratory who enabled e-mail notices (US84, TS78).
   *
   * @param alertId - The unique numeric identifier of the deviation alert
   * @returns Observable stream emitting how many people it was sent to and how many e-mails the provider accepted
   */
  sendAlertEmailNotification(alertId: number): Observable<AlertEmailNotificationResource> {
    return this._alertEndpoint.sendEmailNotification(alertId);
  }

  /**
   * Retrieves the compliance events of an equipment.
   *
   * @param laboratoryId - The laboratory of the equipment
   * @param equipmentId - The unique numeric identifier of the equipment
   * @returns Observable stream emitting an array of ComplianceEvent entities
   *
   * @remarks
   * Accesses the audit trail to retrieve the events linked to the equipment.
   */
  getEquipmentComplianceEvents(laboratoryId: number, equipmentId: number): Observable<ComplianceEvent[]> {
    return this._complianceEventEndpoint.getEquipmentEvents(laboratoryId, equipmentId);
  }

  /**
   * Retrieves the compliance events of a batch.
   *
   * @param batchId - The unique numeric identifier of the batch
   * @returns Observable stream emitting an array of ComplianceEvent entities
   */
  getBatchComplianceEvents(batchId: number): Observable<ComplianceEvent[]> {
    return this._complianceEventEndpoint.getBatchEvents(batchId);
  }

  /**
   * Retrieves the notification preferences of the signed-in user.
   *
   * @returns Observable stream emitting the user's NotificationPreference
   */
  getPreferences(): Observable<NotificationPreference> {
    return this._preferenceEndpoint.getPreferences();
  }

  /**
   * Updates the notification preferences of the signed-in user.
   *
   * @param request - The update data transfer object containing new preference states
   * @returns Observable stream emitting the updated NotificationPreference entity
   */
  updatePreferences(request: UpdateNotificationPreferenceRequest): Observable<NotificationPreference> {
    return this._preferenceEndpoint.updatePreferences(request);
  }

  /**
   * Retrieves the notifications of the signed-in user, newest first (US83).
   *
   * @param unreadOnly - Leaves out the notifications already read
   * @param limit - Maximum number of notifications (1 to 100)
   * @returns Observable stream emitting the notifications
   */
  getNotifications(unreadOnly: boolean, limit: number): Observable<Notification[]> {
    return this._notificationEndpoint.getNotifications(unreadOnly, limit);
  }

  /**
   * Retrieves how many notifications the signed-in user has not read.
   *
   * @returns Observable stream emitting the unread count
   */
  getUnreadNotificationCount(): Observable<number> {
    return this._notificationEndpoint.getUnreadCount();
  }

  /**
   * Marks a notification as read.
   *
   * @param notificationId - The unique numeric identifier of the notification
   * @returns Observable stream emitting the notification, now read
   */
  markNotificationAsRead(notificationId: number): Observable<Notification> {
    return this._notificationEndpoint.markAsRead(notificationId);
  }

  /**
   * Marks every notification of the signed-in user as read.
   *
   * @returns Observable stream emitting how many notifications were unread
   */
  markAllNotificationsAsRead(): Observable<number> {
    return this._notificationEndpoint.markAllAsRead();
  }
}
