/**
 * Intent to consume a released raw material lot for a batch (US75).
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this Command belongs to the application layer. The
 * operation id makes the request idempotent: a retry with the same id returns the original usage
 * instead of consuming twice. Only released, non-expired lots with remaining balance can be consumed.
 *
 * @example
 * ```typescript
 * const command: RegisterRawMaterialUsageCommand = {
 *   rawMaterialBatchId: 45,
 *   amountUsed: 150.5,
 *   unit: 'kg',
 *   operationId: crypto.randomUUID()
 * };
 * ```
 *
 * @author Qualitrack
 */
export interface RegisterRawMaterialUsageCommand {
  /**
   * The numeric identifier of the raw material lot to consume.
   */
  rawMaterialBatchId: number;

  /**
   * The amount to consume from the lot.
   */
  amountUsed: number;

  /**
   * The unit of measurement of the amount (e.g., 'kg', 'g', 'L', 'mL').
   */
  unit: string;

  /**
   * Unique id of the operation; reuse it when retrying so the consumption is not duplicated.
   */
  operationId: string;
}
