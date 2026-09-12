import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { PharmaceuticalProductResource, PharmaceuticalProductsResponse } from './product-response';

/**
 * Assembler for converting between PharmaceuticalProduct domain entities and API resources.
 *
 * @remarks
 * This assembler translates product resources from the backend into domain
 * entities used by the Laboratory bounded context.
 */
export class ProductAssembler implements BaseAssembler<
  PharmaceuticalProduct,
  PharmaceuticalProductResource,
  PharmaceuticalProductsResponse
> {
  /**
   * Converts a product response envelope into domain entities.
   *
   * @param response - API response containing product resources
   * @returns Array of PharmaceuticalProduct domain entities
   */
  toEntitiesFromResponse(response: PharmaceuticalProductsResponse): PharmaceuticalProduct[] {
    return response.products.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a product API resource into a domain entity.
   *
   * @param resource - Product resource received from the API
   * @returns PharmaceuticalProduct domain entity
   */
  toEntityFromResource(resource: PharmaceuticalProductResource): PharmaceuticalProduct {
    return new PharmaceuticalProduct({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      code: resource.code,
      name: resource.name,
      description: resource.description,
      specifications: resource.specifications,
      active: resource.active,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts a PharmaceuticalProduct domain entity into an API resource.
   *
   * @param entity - PharmaceuticalProduct domain entity
   * @returns Product resource ready for API communication
   */
  toResourceFromEntity(entity: PharmaceuticalProduct): PharmaceuticalProductResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      specifications: entity.specifications,
      active: entity.active,
      createdAt: entity.createdAt,
    };
  }
}
