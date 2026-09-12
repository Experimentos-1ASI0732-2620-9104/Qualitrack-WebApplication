/**
 * Request payload for creating a pharmaceutical product.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body sent to the backend when registering a product under a laboratory.
 * System-generated fields such as `id`, `active`, and `createdAt` are excluded.
 */
export interface CreateProductRequest {
  /**
   * The numeric identifier of the laboratory where the product will be registered.
   */
  laboratoryId: number;

  /**
   * The internal catalog code of the product.
   */
  code: string;

  /**
   * The commercial or scientific product name.
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
}
