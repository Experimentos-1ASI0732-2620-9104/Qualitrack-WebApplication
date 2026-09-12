import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { AlertSeverity } from './deviation-alert.entity';

/**
 * Represents a user's notification settings within the Communication domain.
 *
 * @remarks
 * In Domain-Driven Design, NotificationPreference is an entity that defines how
 * and when a user chooses to receive information. It acts as a configuration
 * layer between domain events and the delivery services.
 *
 * This entity ensures that communication remains relevant to the user's
 * preferences, filtering messages by channel and urgency levels.
 *
 * @example
 * ```typescript
 * const userPrefs = new NotificationPreference({
 * id: 1,
 * userId: 101,
 * emailEnabled: true,
 * smsEnabled: false,
 * inAppEnabled: true,
 * minimumSeverity: 'WARNING',
 * createdAt: '2026-05-12T11:28:14Z'
 * });
 *
 * console.log(userPrefs.emailEnabled); // true
 * ```
 */
export class NotificationPreference implements BaseEntity {
  /**
   * The unique numeric identifier for this preference record.
   */
  id: number;

  /**
   * The numeric identifier of the user to whom these preferences belong.
   */
  userId: number;

  /**
   * Indicates if the user wants to receive notifications via email.
   */
  emailEnabled: boolean;

  /**
   * Indicates if the user wants to receive notifications via SMS.
   */
  smsEnabled: boolean;

  /**
   * Indicates if the user wants to receive notifications within the application UI.
   */
  inAppEnabled: boolean;

  /**
   * The threshold of severity required to trigger a notification.
   */
  minimumSeverity: AlertSeverity;

  /**
   * The timestamp indicating when the preference profile was created.
   */
  createdAt?: string;

  /**
   * Creates a new NotificationPreference entity.
   *
   * @param params - Initialization properties
   * @param params.id - The unique numeric identifier for the preference settings
   * @param params.userId - Numeric ID of the owner of these preferences
   * @param params.emailEnabled - Toggle for email delivery
   * @param params.smsEnabled - Toggle for SMS delivery
   * @param params.inAppEnabled - Toggle for in-app delivery
   * @param params.minimumSeverity - Minimum severity level to notify
   * @param params.createdAt - Record creation timestamp
   *
   * @remarks
   * The constructor initializes the notification profile. Identity is tied to
   * the ID, while the behavior focuses on the state of delivery channels.
   */
  constructor(params: {
    id: number;
    userId: number;
    emailEnabled: boolean;
    smsEnabled: boolean;
    inAppEnabled: boolean;
    minimumSeverity: AlertSeverity;
    createdAt?: string;
  }) {
    this.id = params.id;
    this.userId = params.userId;
    this.emailEnabled = params.emailEnabled;
    this.smsEnabled = params.smsEnabled;
    this.inAppEnabled = params.inAppEnabled;
    this.minimumSeverity = params.minimumSeverity;
    this.createdAt = params.createdAt;
  }
}
