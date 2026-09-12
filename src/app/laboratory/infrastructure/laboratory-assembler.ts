import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Laboratory } from '../domain/model/laboratory.entity';
import { LaboratoryResource, LaboratoriesResponse } from './laboratory-response';

/**
 * Assembler for converting between Laboratory domain entities and API resources.
 *
 * @remarks
 * This assembler belongs to the infrastructure layer and isolates the domain
 * model from HTTP response/request shapes.
 */
export class LaboratoryAssembler implements BaseAssembler<
  Laboratory,
  LaboratoryResource,
  LaboratoriesResponse
> {
  /**
   * Converts a laboratory response envelope into domain entities.
   *
   * @param response - API response containing laboratory resources
   * @returns Array of Laboratory domain entities
   */
  toEntitiesFromResponse(response: LaboratoriesResponse): Laboratory[] {
    return response.laboratories.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a laboratory API resource into a domain entity.
   *
   * @param resource - Laboratory resource received from the API
   * @returns Laboratory domain entity
   */
  toEntityFromResource(resource: LaboratoryResource): Laboratory {
    return new Laboratory({
      id: resource.id,
      name: resource.name,
      ruc: resource.ruc,
      address: resource.address,
      phone: resource.phone,
      applicableRegulations: resource.applicableRegulations,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    });
  }

  /**
   * Converts a Laboratory domain entity into an API resource.
   *
   * @param entity - Laboratory domain entity
   * @returns Laboratory resource ready for API communication
   */
  toResourceFromEntity(entity: Laboratory): LaboratoryResource {
    return {
      id: entity.id,
      name: entity.name,
      ruc: entity.ruc,
      address: entity.address,
      phone: entity.phone,
      applicableRegulations: entity.applicableRegulations,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
