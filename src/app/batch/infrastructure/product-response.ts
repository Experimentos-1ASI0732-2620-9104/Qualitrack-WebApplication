import {
  BaseResource,
  BaseResponse
} from '../../shared/infrastructure/base-response';

/**
 * Pharmaceutical product as returned by the API.
 *
 * @remarks
 * Infrastructure-level data contract; {@link ProductAssembler} converts it into a domain
 * `PharmaceuticalProduct`.
 *
 * @author Qualitrack
 */
export interface PharmaceuticalProductResource extends BaseResource {
  /**
   * The unique numeric identifier of the product.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns the product.
   */
  laboratoryId: number;

  /**
   * The environment where the product is manufactured; null for products registered before environments existed.
   */
  environmentId: number | null;

  /**
   * The internal catalog code, unique in the laboratory.
   */
  code: string;

  /**
   * The product name, unique in the laboratory.
   */
  name: string;

  /**
   * The optional description of the product.
   */
  description: string | null;

  /**
   * The technical specifications of the product.
   */
  specifications: string;

  /**
   * Whether the product is active; false when it was discontinued.
   */
  active: boolean;
}

/**
 * Envelope variant of a product collection.
 *
 * @author Qualitrack
 */
export interface PharmaceuticalProductsResponse extends BaseResponse {
  /**
   * Array of product resources included in the response.
   */
  products: PharmaceuticalProductResource[];
}
