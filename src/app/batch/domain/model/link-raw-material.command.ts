/**
 * Represents the intention to link a raw material consumption record to a production batch.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this command belongs to the
 * application layer. It captures the required information to register the
 * consumption of a raw material during a batch manufacturing process.
 *
 * The target batch identifier is provided by the route or caller context, while
 * this command carries the material and quantity data that will be sent to the
 * backend.
 *
 * @example
 * ```typescript
 * const command: LinkRawMaterialCommand = {
 *   rawMaterialId: 45,
 *   quantityUsed: 150.5
 * };
 * ```
 */
export interface LinkRawMaterialCommand {
  /**
   * The numeric identifier of the raw material consumed by the batch.
   */
  rawMaterialId: number;

  /**
   * The amount of raw material consumed during the batch process.
   */
  quantityUsed: number;
  unit: string;
}
