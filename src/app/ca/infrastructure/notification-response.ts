import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AlertSeverity } from '../domain/model/deviation-alert.entity';
import { NotificationSubject, NotificationType } from '../domain/model/notification.entity';

/** Notification as the platform sends it (GET /users/me/notifications). */
export interface NotificationResource extends BaseResource {
  /** Unique identifier of the notification. */
  id: number;
  /** What the notification tells. */
  type: NotificationType;
  /** Severity of the alert; `null` for batch notifications. */
  severity: AlertSeverity | null;
  /** Kind of record the notification is about. */
  subjectType: NotificationSubject;
  /** Identifier of the alert or batch the notification is about. */
  subjectId: number;
  /** Name of the environment of the alert. */
  environmentName: string | null;
  /** Name of the alert or batch the notification is about. */
  subjectName: string | null;
  /** Variable that deviated, for alert notifications. */
  parameterName: string | null;
  /** Value that deviated, for alert notifications. */
  recordedValue: number | null;
  /** Unit of the recorded value. */
  unit: string | null;
  /** Name of the person who caused the event, when somebody did. */
  actorName: string | null;
  /** Comment the actor left, for example the resolution notes. */
  note: string | null;
  /** When the event happened, as an ISO 8601 date-time. */
  occurredAt: string;
  /** When the person read the notification; `null` while it is unread. */
  readAt: string | null;
}

/** Envelope kept for the base assembler; the platform answers with an array. */
export interface NotificationsResponse extends BaseResponse {
  /** Notifications included in the response. */
  notifications: NotificationResource[];
}

/** Answer of GET /users/me/notifications/unread-count. */
export interface UnreadNotificationsResource {
  /** Notifications the person has not read. */
  unreadCount: number;
}

/** Answer of POST /users/me/notifications/read-receipts. */
export interface NotificationsReadResource {
  /** Notifications that were unread and are now read. */
  markedAsRead: number;
}

/** Answer of POST /deviation-alerts/{alertId}/email-notifications (TS78). */
export interface AlertEmailNotificationResource {
  /** Alert that was e-mailed. */
  alertId: number;
  /** People of the laboratory the e-mail was meant for, those who enabled e-mail notices. */
  recipients: number;
  /** E-mails the provider accepted. */
  delivered: number;
  /** When the e-mails were sent, as an ISO 8601 date-time. */
  sentAt: string;
}
