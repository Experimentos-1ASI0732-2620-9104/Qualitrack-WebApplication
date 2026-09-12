import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import {
  NotificationPreferenceResource,
  NotificationPreferencesResponse,
} from './notification-preference-response';

/**
 * Assembler for converting between NotificationPreference domain entities and infrastructure resources.
 *
 * @remarks
 * In DDD, this assembler is responsible for transforming between:
 * - {@link NotificationPreference} - Domain entity managing user communication settings
 * - {@link NotificationPreferenceResource} - Infrastructure resource for API communication
 * - {@link NotificationPreferencesResponse} - Response envelope from collection operations
 *
 * This ensures the domain layer remains decoupled from infrastructure concerns
 * like API response formats, serialization details, and communication protocols.
 *
 * @example
 * ```typescript
 * const assembler = new NotificationPreferenceAssembler();
 *
 * // From API response to domain entities
 * const preferences = assembler.toEntitiesFromResponse(apiResponse);
 *
 * // From domain entity to API resource
 * const resource = assembler.toResourceFromEntity(notificationPreference);
 * ```
 */
export class NotificationPreferenceAssembler implements BaseAssembler<
  NotificationPreference,
  NotificationPreferenceResource,
  NotificationPreferencesResponse
> {
  /**
   * Converts a collection response into an array of domain entities.
   *
   * @param response - The API response containing notification preference resources
   * @returns Array of NotificationPreference domain entities
   *
   * @remarks
   * Extracts the preferences array from the response envelope and converts
   * each resource into a domain NotificationPreference entity.
   */
  toEntitiesFromResponse(response: NotificationPreferencesResponse): NotificationPreference[] {
    return response.preferences.map((pref) => this.toEntityFromResource(pref));
  }

  /**
   * Converts an array of resources into an array of domain entities.
   *
   * @param resources - Array of notification preference resources
   * @returns Array of NotificationPreference domain entities
   */
  toEntitiesFromResources(resources: NotificationPreferenceResource[]): NotificationPreference[] {
    return resources.map((pref) => this.toEntityFromResource(pref));
  }

  /**
   * Converts an infrastructure resource into a domain entity.
   *
   * @param resource - The NotificationPreferenceResource to convert
   * @returns A new NotificationPreference domain entity
   *
   * @remarks
   * Maps resource properties directly to entity properties, ensuring the
   * returned entity is ready for use within the communication domain logic.
   */
  toEntityFromResource(resource: NotificationPreferenceResource): NotificationPreference {
    return new NotificationPreference({
      id: resource.id,
      userId: resource.userId,
      emailEnabled: resource.emailEnabled,
      smsEnabled: resource.smsEnabled,
      inAppEnabled: resource.inAppEnabled,
      minimumSeverity: resource.minimumSeverity,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts a domain entity into an infrastructure resource.
   *
   * @param entity - The NotificationPreference domain entity to convert
   * @returns A new NotificationPreferenceResource suitable for API communication
   *
   * @remarks
   * Extracts only the configuration data for API serialization, excluding
   * any domain-specific behavior or internal state management.
   */
  toResourceFromEntity(entity: NotificationPreference): NotificationPreferenceResource {
    return {
      id: entity.id,
      userId: entity.userId,
      emailEnabled: entity.emailEnabled,
      smsEnabled: entity.smsEnabled,
      inAppEnabled: entity.inAppEnabled,
      minimumSeverity: entity.minimumSeverity,
      createdAt: entity.createdAt,
    };
  }
}
