import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Notification } from '../domain/model/notification.entity';
import { NotificationResource, NotificationsResponse } from './notification-response';

/**
 * Converts the notifications sent by the platform into {@link Notification} entities.
 *
 * @remarks
 * The platform answers with a plain array, so {@link NotificationAssembler.toEntitiesFromResponse} only exists to
 * fulfil the contract of the base assembler.
 */
export class NotificationAssembler
  implements BaseAssembler<Notification, NotificationResource, NotificationsResponse>
{
  /**
   * Converts a response envelope into entities.
   *
   * @param response - The envelope with the notification resources
   * @returns The notifications, in the order they were received
   */
  toEntitiesFromResponse(response: NotificationsResponse): Notification[] {
    return response.notifications.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a notification resource into an entity.
   *
   * @param resource - The notification as the platform sends it
   * @returns The notification
   */
  toEntityFromResource(resource: NotificationResource): Notification {
    return new Notification({ ...resource });
  }

  /**
   * Converts a notification into its resource.
   *
   * @param entity - The notification
   * @returns The notification resource
   */
  toResourceFromEntity(entity: Notification): NotificationResource {
    return {
      id: entity.id,
      type: entity.type,
      severity: entity.severity,
      subjectType: entity.subjectType,
      subjectId: entity.subjectId,
      environmentName: entity.environmentName,
      subjectName: entity.subjectName,
      parameterName: entity.parameterName,
      recordedValue: entity.recordedValue,
      unit: entity.unit,
      actorName: entity.actorName,
      note: entity.note,
      occurredAt: entity.occurredAt,
      readAt: entity.readAt,
    };
  }
}
