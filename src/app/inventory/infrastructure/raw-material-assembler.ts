import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { RawMaterialResource, RawMaterialsResponse } from './raw-material-response';

/**
 * Assembler for converting between RawMaterial domain entities
 * and infrastructure resources.
 *
 * @remarks
 * In Domain-Driven Design, this assembler is responsible
 * for transforming between:
 * - {@link RawMaterial} - Domain entity representing
 *   a raw material registered in the inventory system.
 * - {@link RawMaterialResource} - Infrastructure resource
 *   used for API communication.
 * - {@link RawMaterialsResponse} - API response containing
 *   a collection of raw material resources.
 *
 * This assembler maps material identification, laboratory
 * and storage environment references, measurement units,
 * stock quantities, stock classifications, and legacy
 * material information between domain entities and resources.
 *
 * It ensures that the domain layer remains decoupled from
 * infrastructure concerns such as API response formats
 * and serialization details.
 */
export class RawMaterialAssembler implements BaseAssembler<
  RawMaterial,
  RawMaterialResource,
  RawMaterialsResponse
> {
  /**
   * Converts a raw material resource into a domain entity.
   *
   * @param resource - The RawMaterialResource to convert.
   * @returns A new RawMaterial domain entity.
   *
   * @remarks
   * Maps the resource properties to a new RawMaterial instance,
   * including identification data, laboratory and environment
   * references, measurement unit, stock quantities, stock
   * classification, and legacy material identifier.
   *
   * If environmentId is null or undefined, the property
   * is initialized to null in the domain entity.
   *
   * Stock quantities and classifications are preserved
   * as supplied by the backend without performing
   * additional inventory calculations.
   */
  toEntityFromResource(resource: RawMaterialResource): RawMaterial {
    return new RawMaterial({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      environmentId: resource.environmentId ?? null,
      code: resource.code,
      name: resource.name,
      unit: resource.unit,
      minimumStock: resource.minimumStock,
      usableStock: resource.usableStock,
      physicalStock: resource.physicalStock,
      stockStatus: resource.stockStatus,
      legacyId: resource.legacyId,
    });
  }

  /**
   * Converts a raw material domain entity into
   * an infrastructure resource.
   *
   * @param entity - The RawMaterial domain entity to convert.
   * @returns A RawMaterialResource suitable for API communication.
   *
   * @remarks
   * Extracts the properties of the domain entity and
   * maps them to the corresponding resource structure.
   *
   * The conversion includes material identifiers,
   * laboratory and environment references, stock
   * quantities, stock classification, and legacy information.
   *
   * No business calculations or additional transformations
   * are performed during this mapping.
   */
  toResourceFromEntity(entity: RawMaterial): RawMaterialResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      environmentId: entity.environmentId,
      code: entity.code,
      name: entity.name,
      unit: entity.unit,
      minimumStock: entity.minimumStock,
      usableStock: entity.usableStock,
      physicalStock: entity.physicalStock,
      stockStatus: entity.stockStatus,
      legacyId: entity.legacyId,
    };
  }

  /**
   * Converts an API response containing raw materials
   * into an array of domain entities.
   *
   * @param response - The API response containing raw material resources.
   * @returns An array of RawMaterial domain entities.
   *
   * @remarks
   * Extracts the rawMaterials collection from the
   * RawMaterialsResponse and converts each resource
   * into a RawMaterial entity using the
   * toEntityFromResource method.
   *
   * If the response contains an empty rawMaterials
   * collection, the method returns an empty array.
   */
  toEntitiesFromResponse(response: RawMaterialsResponse): RawMaterial[] {
    return response.rawMaterials.map((resource) => this.toEntityFromResource(resource));
  }
}
