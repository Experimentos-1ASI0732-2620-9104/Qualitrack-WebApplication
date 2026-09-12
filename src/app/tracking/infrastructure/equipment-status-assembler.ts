import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { EquipmentStatus } from '../domain/model/equipment-status.entity';
import { EquipmentStatusResource, EquipmentStatusesResponse } from './equipment-status-response';

/**
 * Assembler for converting between EquipmentStatus domain entities and API resources.
 *
 * @remarks
 * This assembler translates equipment telemetry status resources from the
 * infrastructure layer into domain entities used by the tracking bounded context.
 */
export class EquipmentStatusAssembler implements BaseAssembler<
  EquipmentStatus,
  EquipmentStatusResource,
  EquipmentStatusesResponse
> {
  /**
   * Converts an equipment status response envelope into domain entities.
   *
   * @param response - API response containing equipment status resources
   * @returns Array of EquipmentStatus domain entities
   */
  toEntitiesFromResponse(response: EquipmentStatusesResponse): EquipmentStatus[] {
    return response.statuses.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an equipment status API resource into a domain entity.
   *
   * @param resource - Equipment status resource received from the API
   * @returns EquipmentStatus domain entity
   */
  toEntityFromResource(resource: EquipmentStatusResource): EquipmentStatus {
    return new EquipmentStatus({
      id: resource.id,
      equipmentId: resource.equipmentId,
      isOnline: resource.isOnline,
      currentStatus: resource.currentStatus,
      lastHeartbeat: resource.lastHeartbeat,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts an EquipmentStatus domain entity into an API resource.
   *
   * @param entity - EquipmentStatus domain entity
   * @returns EquipmentStatus resource ready for API communication
   */
  toResourceFromEntity(entity: EquipmentStatus): EquipmentStatusResource {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      isOnline: entity.isOnline,
      currentStatus: entity.currentStatus,
      lastHeartbeat: entity.lastHeartbeat,
      createdAt: entity.createdAt,
    };
  }
}
