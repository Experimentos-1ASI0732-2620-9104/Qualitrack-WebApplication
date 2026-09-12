import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Equipment } from '../domain/model/equipment.entity';
import { EquipmentResource, EquipmentsResponse } from './equipment-response';

/**
 * Assembler responsible for transforming equipment data between
 * API resources and domain entities.
 *
 * @remarks
 * This class acts as a mapping layer between the infrastructure layer and
 * the domain layer. It converts equipment resources received from the API
 * into Equipment domain entities, and also converts Equipment entities back
 * into API-compatible resources.
 *
 * Using an assembler helps keep the domain model independent from the
 * structure used by external services or HTTP responses.
 *
 * @example
 * ```typescript
 * const assembler = new EquipmentAssembler();
 *
 * const equipment = assembler.toEntityFromResource({
 *   id: 'equipment-001',
 *   labId: 'lab-001',
 *   name: 'Centrifuge',
 *   type: 'Laboratory Equipment',
 *   model: 'CF-3000',
 *   serialNumber: 'SN-2026-001',
 *   status: 'OPERATIONAL',
 *   createdAt: '2026-05-12T10:00:00Z'
 * });
 *
 * console.log(equipment.name); // 'Centrifuge'
 * ```
 */
export class EquipmentAssembler implements BaseAssembler<
  Equipment,
  EquipmentResource,
  EquipmentsResponse
> {
  /**
   * Converts an equipment API response into a list of domain entities.
   *
   * @param response - The API response containing equipment resources.
   * @returns An array of Equipment domain entities.
   *
   * @remarks
   * This method maps each resource contained in the equipments collection
   * and converts it into an Equipment entity using toEntityFromResource.
   */
  toEntitiesFromResponse(response: EquipmentsResponse): Equipment[] {
    return response.equipments.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an equipment resource into a domain entity.
   *
   * @param resource - The equipment resource received from the API.
   * @returns An Equipment domain entity.
   *
   * @remarks
   * This method maps the raw API resource fields into the Equipment constructor,
   * preserving its laboratory reference, identification data, technical
   * information, operational status, and creation date.
   */
  toEntityFromResource(resource: EquipmentResource): Equipment {
    return new Equipment({
      id: resource.id,
      labId: resource.laboratoryId,
      name: resource.name,
      type: resource.type,
      model: resource.model,
      serialNumber: resource.serialNumber,
      status: resource.status,
      sensorExternalId: resource.sensorExternalId,
      createdAt: resource.createdAt ?? ''
    });
  }

  /**
   * Converts an Equipment domain entity into an API resource.
   *
   * @param entity - The Equipment domain entity to be converted.
   * @returns An EquipmentResource compatible with the API structure.
   *
   * @remarks
   * This method is useful when the application needs to serialize an equipment
   * entity using the structure expected by the infrastructure layer or backend API.
   */
  toResourceFromEntity(entity: Equipment): EquipmentResource {
    return {
      id: entity.id,
      laboratoryId: entity.labId,
      name: entity.name,
      type: entity.type,
      model: entity.model,
      serialNumber: entity.serialNumber,
      status: entity.status,
      sensorExternalId: entity.sensorExternalId,
      createdAt: entity.createdAt,
    } as EquipmentResource;
  }
}
