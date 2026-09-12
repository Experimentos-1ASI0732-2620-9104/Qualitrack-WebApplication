import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { RawMaterialResource, RawMaterialsResponse } from './raw-material-response';

/**
 * Assembler for converting between RawMaterial domain entities and API resources.
 *
 * @remarks
 * This assembler maps backend inventory field names into the frontend domain
 * model. Specifically, `currentStock` maps to `quantityInStock`, and
 * `minimumThreshold` maps to `minimumStock`.
 */
export class RawMaterialAssembler implements BaseAssembler<
  RawMaterial,
  RawMaterialResource,
  RawMaterialsResponse
> {
  /**
   * Converts a raw materials response envelope into domain entities.
   *
   * @param response - API response containing raw material resources
   * @returns Array of RawMaterial domain entities
   */
  toEntitiesFromResponse(response: RawMaterialsResponse): RawMaterial[] {
    return response.rawMaterials.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a raw material API resource into a domain entity.
   *
   * @param resource - Raw material resource received from the API
   * @returns RawMaterial domain entity
   */
  toEntityFromResource(resource: RawMaterialResource): RawMaterial {
    return new RawMaterial({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      name: resource.name,
      code: resource.code,
      supplier: resource.supplier,
      batchNumber: resource.batchNumber,
      expirationDate: resource.expirationDate,
      quantityInStock: resource.currentStock,
      unit: resource.unit,
      minimumStock: resource.minimumThreshold,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts a RawMaterial domain entity into an API resource.
   *
   * @param entity - RawMaterial domain entity
   * @returns Raw material resource ready for API communication
   */
  toResourceFromEntity(entity: RawMaterial): RawMaterialResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      name: entity.name,
      code: entity.code,
      supplier: entity.supplier,
      batchNumber: entity.batchNumber,
      expirationDate: entity.expirationDate,
      currentStock: entity.quantityInStock,
      unit: entity.unit,
      minimumThreshold: entity.minimumStock,
      createdAt: entity.createdAt,
    };
  }
}
