/**
 * Command for creating a pharmaceutical product.
 *
 * @remarks
 * In CQRS, this command represents the intent to register a new product under
 * a specific laboratory catalog.
 */
export interface CreateProductCommand {
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
