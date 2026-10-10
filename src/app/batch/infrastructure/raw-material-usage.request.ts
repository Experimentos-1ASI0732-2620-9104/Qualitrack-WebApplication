/**
 * Body of POST .../batches/{batchId}/raw-material-usages.
 *
 * @remarks
 * Infrastructure-level contract sent to the API to consume a released raw material lot in a batch. The
 * operation id makes the request idempotent: a retry with the same id returns the original usage instead
 * of consuming twice.
 *
 * @example
 * ```typescript
 * const request: RegisterRawMaterialUsageRequest = {
 *   rawMaterialBatchId: 45,
 *   amountUsed: 150.5,
 *   unit: 'kg',
 *   operationId: crypto.randomUUID()
 * };
 * ```
 *
 * @author Qualitrack
 */
export interface RegisterRawMaterialUsageRequest {
  /**
   * The numeric identifier of the raw material lot to consume.
   */
  rawMaterialBatchId: number;

  /**
   * The amount to consume from the lot.
   */
  amountUsed: number;

  /**
   * The unit of measurement of the amount.
   */
  unit: string;

  /**
   * Unique id of the operation; reuse it when retrying so the consumption is not duplicated.
   */
  operationId: string;
}
