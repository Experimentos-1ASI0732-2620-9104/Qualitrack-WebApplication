import { AlertSeverity } from '../domain/model/deviation-alert.entity';

/**
 * Data Transfer Object (DTO) for updating notification preferences.
 *
 * @remarks
 * In DDD, this request interface represents the payload sent from the
 * infrastructure layer to the API to modify an existing preference entity.
 * It contains only the fields that are allowed to be updated by the user
 * or the system, excluding immutable fields like 'id' or 'userId'.
 *
 * @example
 * ```typescript
 * const updateRequest: UpdateNotificationPreferenceRequest = {
 *   emailEnabled: true,
 *   smsEnabled: false,
 *   inAppEnabled: true,
 *   minimumSeverity: 'CRITICAL'
 * };
 * ```
 */
export interface UpdateNotificationPreferenceRequest {
  /**
   * New status for email notification delivery.
   */
  emailEnabled: boolean;

  /**
   * New status for SMS notification delivery.
   */
  smsEnabled: boolean;

  /**
   * New status for in-app notification delivery.
   */
  inAppEnabled: boolean;

  /**
   * The new minimum severity threshold for triggering notifications.
   */
  minimumSeverity: AlertSeverity;
}
