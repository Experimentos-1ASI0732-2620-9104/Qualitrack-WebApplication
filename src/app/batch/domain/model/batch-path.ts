/**
 * Path of a batch inside its laboratory, environment and product.
 *
 * @author Qualitrack
 */
export interface BatchPath {
  /**
   * The laboratory that owns the batch.
   */
  laboratoryId: number;

  /**
   * The environment where the product is manufactured.
   */
  environmentId: number;

  /**
   * The product the batch belongs to.
   */
  productId: number;
}
