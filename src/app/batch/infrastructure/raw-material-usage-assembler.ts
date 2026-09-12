import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';
import { RawMaterialUsageResource, RawMaterialUsagesResponse } from './raw-material-usage-response';

/**
 * Assembler for converting between RawMaterialUsage domain entities and infrastructure resources.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) context, this assembler facilitates the bidirectional transformation between:
 * - {@link RawMaterialUsage} - The domain entity capturing the consumption logic and traceability data.
 * - {@link RawMaterialUsageResource} - The infrastructure-level contract used for API communication.
 * - {@link RawMaterialUsagesResponse} - The envelope for collection-based API responses.
 *
 * This implementation ensures that the domain layer remains decoupled from serialization formats,
 * field naming conventions of external APIs, and infrastructure-specific response structures.
 *
 * @example
 * ```typescript
 * const assembler = new RawMaterialUsageAssembler();
 *
 * // Mapping from infrastructure response to domain entities
 * const usageEntities = assembler.toEntitiesFromResponse(apiResponse);
 *
 * // Mapping from domain entity to infrastructure resource
 * const usageResource = assembler.toResourceFromEntity(entity);
 *
 ```
 *
 * @author Qualitrack
 */
export class RawMaterialUsageAssembler implements BaseAssembler<
  RawMaterialUsage,
  RawMaterialUsageResource,
  RawMaterialUsagesResponse
> {
  /**
   * Converts a raw material usage collection response into an array of domain entities.
   *
   * @param response - The API response envelope containing multiple usage resources.
   * @returns An array of RawMaterialUsage domain entities.
   *
   * @remarks
   * Extracts the internal resource collection from the response envelope and delegates
   * the mapping of each individual item to {@link toEntityFromResource}.
   */
  toEntitiesFromResponse(response: RawMaterialUsagesResponse): RawMaterialUsage[] {
    return response.rawMaterialUsages.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Reconstitutes a RawMaterialUsage domain entity from an infrastructure resource.
   *
   * @param resource - The raw data resource from the infrastructure layer.
   * @returns A new instance of the RawMaterialUsage domain entity.
   *
   * @remarks
   * Maps every infrastructure property to the entity constructor, ensuring the
   * resulting object is a valid domain representation ready for business logic operations.
   */
  toEntityFromResource(resource: RawMaterialUsageResource): RawMaterialUsage {
    return new RawMaterialUsage({
      id: resource.id,
      stockBefore: resource.stockBefore,
      stockAfter: resource.stockAfter,
      batchId: resource.batchId,
      rawMaterialId: resource.rawMaterialId,
      rawMaterialName: resource.rawMaterialName,
      quantityUsed: resource.quantityUsed,
      unit: resource.unit,
      usageDate: resource.usageDate,
      createdAt: resource.createdAt ?? ''
    });
  }

  /**
   * Serializes a RawMaterialUsage domain entity into an infrastructure-ready resource.
   *
   * @param entity - The domain entity to be converted.
   * @returns A plain object following the RawMaterialUsageResource contract.
   *
   * @remarks
   * Strips the entity of any domain methods or internal logic, providing only the
   * raw data state required for external transmission or persistence via the API.
   */
  toResourceFromEntity(entity: RawMaterialUsage): RawMaterialUsageResource {
    return {
      id: entity.id,
      stockBefore: entity.stockBefore,
      stockAfter: entity.stockAfter,
      batchId: entity.batchId,
      rawMaterialId: entity.rawMaterialId,
      rawMaterialName: entity.rawMaterialName,
      quantityUsed: entity.quantityUsed,
      unit: entity.unit,
      usageDate: entity.usageDate,
      createdAt: entity.createdAt,
    } as RawMaterialUsageResource;
  }
}
