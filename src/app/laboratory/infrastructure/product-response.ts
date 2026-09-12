import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a pharmaceutical product for API communication.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and mirrors the backend
 * product resource contract. It is converted into a PharmaceuticalProduct
 * domain entity by the corresponding assembler.
 */
export interface PharmaceuticalProductResource extends BaseResource {
  /**
   * The unique numeric identifier of the product.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns this product.
   */
  laboratoryId: number;

  /**
   * The internal catalog code of the product.
   */
  code: string;

  /**
   * The commercial or scientific name of the product.
   */
  name: string;

  /**
   * A human-readable product description.
   */
  description: string;

  /**
   * The technical specifications of the product.
   */
  specifications: string;

  /**
   * Indicates whether the product is active.
   */
  active: boolean;

  /**
   * The ISO 8601 timestamp indicating when the product was created.
   */
  createdAt: string;
}

/**
 * Response envelope for pharmaceutical product collection queries.
 *
 * @remarks
 * This response is used when the backend returns products inside a collection
 * wrapper.
 */
export interface PharmaceuticalProductsResponse extends BaseResponse {
  /**
   * Array of pharmaceutical product resources returned by the API.
   */
  products: PharmaceuticalProductResource[];
}
