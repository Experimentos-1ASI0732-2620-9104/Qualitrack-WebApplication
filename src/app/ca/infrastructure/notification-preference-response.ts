import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AlertSeverity } from '../domain/model/deviation-alert.entity';

/**
 * Resource representation of a notification preference for API communication.
 *
 * @remarks
 * In DDD, this is an infrastructure-level resource contract that represents
 * the notification preference as it appears in HTTP communication, without domain logic.
 * Resources serve as the bridge between the domain layer (NotificationPreference entity)
 * and external systems, ensuring proper separation of concerns.
 *
 * This resource includes all the configuration toggles and thresholds for
 * user-specific communication delivery.
 */
export interface NotificationPreferenceResource extends BaseResource {
  /**
   * Unique numeric identifier for the notification preference resource.
   */
  id: number;

  /**
   * Numeric identifier for the user who owns these preferences.
   * This is a foreign key reference to the User aggregate.
   */
  userId: number;

  /**
   * Status of the email notification channel.
   */
  emailEnabled: boolean;

  /**
   * Status of the SMS notification channel.
   */
  smsEnabled: boolean;

  /**
   * Status of the in-app notification channel.
   */
  inAppEnabled: boolean;

  /**
   * The minimum level of severity required to trigger a notification.
   */
  minimumSeverity: AlertSeverity;

  /**
   * The timestamp of when the preference record was created.
   */
  createdAt?: string;
}

/**
 * Response envelope for notification preference collection queries.
 *
 * @remarks
 * This interface defines the structure of API responses that return multiple preference records.
 * The envelope pattern allows for consistent metadata handling and potential future
 * additions like pagination or bulk operation results.
 *
 * @example
 * ```typescript
 * // API returns:
 * // {
 * //   preferences: [
 * //     { id: 1, userId: 123, emailEnabled: true, ... },
 * //     { id: 2, userId: 456, emailEnabled: false, ... }
 * //   ]
 * // }
 * ```
 */
export interface NotificationPreferencesResponse extends BaseResponse {
  /**
   * Array of notification preference resources included in the response.
   * Contains zero or more NotificationPreferenceResource objects, each representing
   * a preference profile that can be converted into a domain entity.
   */
  preferences: NotificationPreferenceResource[];
}
