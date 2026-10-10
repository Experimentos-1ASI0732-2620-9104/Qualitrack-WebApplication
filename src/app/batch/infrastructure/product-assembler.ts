import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import {
  PharmaceuticalProductResource,
  PharmaceuticalProductsResponse
} from './product-response';

/**
 * Maps pharmaceutical products between API resources and domain entities.
 *
 * @remarks
 * Keeps the domain layer decoupled from the shape of the API responses.
 *
 * @example
 * ```typescript
 * const assembler = new ProductAssembler();
 *
 * // Mapping from an API resource to a domain entity
 * const product = assembler.toEntityFromResource(resource);
 * ```
 *
 * @author Qualitrack
 */
export class ProductAssembler implements BaseAssembler<
  PharmaceuticalProduct,
  PharmaceuticalProductResource,
  PharmaceuticalProductsResponse
> {
  /**
   * Converts a product collection response into an array of domain entities.
   *
   * @param response - The API response envelope containing the product resources.
   * @returns An array of PharmaceuticalProduct entities.
   */
  toEntitiesFromResponse(response: PharmaceuticalProductsResponse): PharmaceuticalProduct[] {
    return response.products.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a product resource into a domain entity.
   *
   * @param resource - The API resource.
   * @returns The PharmaceuticalProduct entity; a missing environment or description becomes null.
   */
  toEntityFromResource(resource: PharmaceuticalProductResource): PharmaceuticalProduct {
    return new PharmaceuticalProduct({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      environmentId: resource.environmentId ?? null,
      code: resource.code,
      name: resource.name,
      description: resource.description ?? null,
      specifications: resource.specifications,
      active: resource.active,
    });
  }

  /**
   * Converts a domain entity into a product resource.
   *
   * @param entity - The PharmaceuticalProduct entity.
   * @returns A plain copy of the entity following the resource contract.
   */
  toResourceFromEntity(entity: PharmaceuticalProduct): PharmaceuticalProductResource {
    return { ...entity };
  }
}
