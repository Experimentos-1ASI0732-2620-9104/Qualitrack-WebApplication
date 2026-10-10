import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { AlertSeverity } from './deviation-alert.entity';

/** What a notification tells: a step of an alert or a quality decision on a batch. */
export type NotificationType =
  /** An alert was opened. */
  | 'ALERT_OPENED'
  /** The severity of an open alert rose. */
  | 'ALERT_ESCALATED'
  /** Somebody started attending an alert. */
  | 'ALERT_ACKNOWLEDGED'
  /** Somebody resolved an alert. */
  | 'ALERT_RESOLVED'
  /** A batch was released by quality. */
  | 'BATCH_RELEASED'
  /** A batch was rejected by quality. */
  | 'BATCH_REJECTED';

/** Record a notification is about; it decides where the notification links to. */
export type NotificationSubject = 'ALERT' | 'BATCH';

/**
 * Notice of something that happened to an alert or a batch of the laboratory that the person did not do (US83).
 *
 * @remarks
 * The platform sends the values; the text is composed in the language of the person.
 *
 * @example
 * ```typescript
 * const notification = new Notification({
 *   id: 3,
 *   type: 'ALERT_OPENED',
 *   severity: 'CRITICAL',
 *   subjectType: 'ALERT',
 *   subjectId: 7,
 *   environmentName: 'Cold room',
 *   subjectName: null,
 *   parameterName: 'Temperature',
 *   recordedValue: 9.4,
 *   unit: '°C',
 *   actorName: null,
 *   note: null,
 *   occurredAt: '2026-10-04T10:00:00Z',
 *   readAt: null,
 * });
 *
 * console.log(notification.isRead); // false
 * console.log(notification.link); // ['/alerts/deviation-detail', '7']
 * ```
 */
export class Notification implements BaseEntity {
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
  /** Unit of {@link Notification.recordedValue}. */
  unit: string | null;
  /** Name of the person who caused the event, when somebody did. */
  actorName: string | null;
  /** Comment the actor left, for example the resolution notes. */
  note: string | null;
  /** When the event happened, as an ISO 8601 date-time. */
  occurredAt: string;
  /** When the person read the notification; `null` while it is unread. */
  readAt: string | null;

  /**
   * Creates a new Notification entity.
   *
   * @param params - Initialization properties; see the fields of the class for the meaning of each one
   */
  constructor(params: {
    id: number;
    type: NotificationType;
    severity: AlertSeverity | null;
    subjectType: NotificationSubject;
    subjectId: number;
    environmentName: string | null;
    subjectName: string | null;
    parameterName: string | null;
    recordedValue: number | null;
    unit: string | null;
    actorName: string | null;
    note: string | null;
    occurredAt: string;
    readAt: string | null;
  }) {
    this.id = params.id;
    this.type = params.type;
    this.severity = params.severity;
    this.subjectType = params.subjectType;
    this.subjectId = params.subjectId;
    this.environmentName = params.environmentName;
    this.subjectName = params.subjectName;
    this.parameterName = params.parameterName;
    this.recordedValue = params.recordedValue;
    this.unit = params.unit;
    this.actorName = params.actorName;
    this.note = params.note;
    this.occurredAt = params.occurredAt;
    this.readAt = params.readAt;
  }

  /** `true` once the person has read the notification. */
  get isRead(): boolean {
    return this.readAt !== null;
  }

  /** Route of the alert or the batch the notification is about. */
  get link(): string[] {
    return this.subjectType === 'ALERT'
      ? ['/alerts/deviation-detail', String(this.subjectId)]
      : ['/batches/batch-detail', String(this.subjectId)];
  }

  /**
   * Material icon of the notification.
   *
   * @returns `error` for critical openings and escalations, `warning` for the others, and a fixed icon for each
   * other type.
   */
  get icon(): string {
    switch (this.type) {
      case 'ALERT_OPENED':
      case 'ALERT_ESCALATED':
        return this.severity === 'CRITICAL' ? 'error' : 'warning';
      case 'ALERT_ACKNOWLEDGED':
        return 'visibility';
      case 'ALERT_RESOLVED':
        return 'task_alt';
      case 'BATCH_RELEASED':
        return 'verified';
      case 'BATCH_REJECTED':
        return 'block';
    }
  }
}
