/**
 * Request payload for registering a raw material.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body sent to the backend when adding a raw material to laboratory
 * inventory. System-generated fields such as `id` and `createdAt` are excluded.
 */
export interface CreateRawMaterialRequest {
  /**
   * The numeric identifier of the laboratory where the raw material will be registered.
   */
  laboratoryId: number;

  /**
   * The common or chemical name of the raw material.
   */
  name: string;

  /**
   * The internal catalog code of the raw material.
   */
  code: string;

  /**
   * The supplier or vendor name.
   */
  supplier: string;

  /**
   * The supplier batch or lot number.
   */
  batchNumber: string;

  /**
   * The expiration date in ISO date format.
   */
  expirationDate: string;

  /**
   * The initial stock quantity.
   */
  quantityInStock: number;

  /**
   * The unit of measurement.
   */
  unit: string;

  /**
   * The minimum stock threshold.
   */
  minimumStock: number;
}
