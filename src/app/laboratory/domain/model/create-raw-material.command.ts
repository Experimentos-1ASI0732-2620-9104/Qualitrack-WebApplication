/**
 * Command for registering a new raw material.
 *
 * @remarks
 * In CQRS, this command represents the intent to add a raw material to a
 * laboratory inventory, including traceability and stock threshold data.
 */
export interface CreateRawMaterialCommand {
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
