import { AlertSeverity } from './deviation-alert.entity';

/**
 * Command for updating notification preferences.
 *
 * @remarks
 * In Domain-Driven Design (DDD), this command acts as a Data Transfer Object (DTO)
 * within the application layer. It encapsulates the intent to change the
 * notification state, carrying all necessary parameters to execute the update
 * through the store or application services.
 *
 * @example
 * ```typescript
 * const command: UpdateNotificationPreferenceCommand = {
 *   emailEnabled: true,
 *   smsEnabled: false,
 *   inAppEnabled: true,
 *   minimumSeverity: 'WARNING'
 * };
 * ```
 */
export interface UpdateNotificationPreferenceCommand {
  /**
   * Indicates whether email notifications should be enabled.
   */
  emailEnabled: boolean;

  /**
   * Indicates whether SMS notifications should be enabled.
   */
  smsEnabled: boolean;

  /**
   * Indicates whether in-app notifications should be enabled.
   */
  inAppEnabled: boolean;

  /**
   * The minimum severity level required for a notification to be sent.
   */
  minimumSeverity: AlertSeverity;
}
