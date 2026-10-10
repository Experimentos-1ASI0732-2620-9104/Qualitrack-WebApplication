
import { RawMaterialBatchStatus } from './raw-material-batch.entity';

/**
 * Represents a command to review a raw material batch
 * within the inventory domain.
 *
 * @remarks
 * Encapsulates the information required to request a review
 * of a raw material batch in the inventory bounded context.
 *
 * The command contains the batch status resulting from
 * the review and the reason associated with that decision.
 *
 * This interface defines the data required to request
 * the operation but does not implement the business logic
 * responsible for validating or processing the review.
 *
 * @example
 * ```TypeScript
 * const command: ReviewRawMaterialBatchCommand = {
 *   status: 'RELEASED',
 *   reason: 'Batch approved after quality inspection'
 * };
 *
 * console.log(command.status); // 'RELEASED'
 * console.log(command.reason);
 * // 'Batch approved after quality inspection'
 * ```
 */
export interface ReviewRawMaterialBatchCommand {
  /**
   * The status assigned to the raw material batch
   * as a result of the review.
   *
   * @remarks
   * The value must correspond to one of the supported
   * RawMaterialBatchStatus values:
   * QUARANTINED, RELEASED, OBSERVED, or REJECTED.
   *
   * The command does not validate whether the requested
   * status transition is permitted.
   */
  status: RawMaterialBatchStatus;

  /**
   * The reason or justification associated with
   * the raw material batch review.
   *
   * @remarks
   * This value provides contextual information
   * explaining the review decision.
   */
  reason: string;
}

