/**
 * Represents the intention to reject a production batch that failed quality control.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this Command belongs to the application layer.
 * It encapsulates the necessary parameters to execute the rejection of a batch, acting as a
 * strict boundary contract for the use case. The rejection process is critical for Good
 * Manufacturing Practices (GMP / BPM) compliance, requiring a clear and auditable justification.
 *
 * @example
 * ```typescript
 * const command: RejectBatchCommand = {
 * batchId: 101,
 * rejectionDate: '2026-05-12T10:00:00Z',
 * reason: 'Failed pH level test during final quality control phase. Does not meet BPM standards.'
 * };
 *
 * await rejectBatchUseCase.execute(command);
 * ```
 *
 * @author Qualitrack
 */
export interface RejectBatchCommand {
  /**
   * The ISO date string representing the exact moment the rejection was formalized.
   */
  rejectionDate: string;

  /**
   * The specific justification for the rejection, aligned with Good Manufacturing Practices (BPM/GMP).
   */
  reason: string;
}
