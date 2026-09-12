/**
 * Represents the intention to officially release a production batch after successful quality control.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this Command belongs to the application layer.
 * It encapsulates the necessary parameters to execute the release of a batch, acting as a
 * strict boundary contract for the use case. Releasing a batch indicates that it has passed
 * all required testing and meets Good Manufacturing Practices (BPM/GMP) for distribution or use.
 *
 * @example
 * ```typescript
 * const command: ReleaseBatchCommand = {
 * batchId: 101,
 * releaseDate: '2026-05-12T11:30:00Z',
 * notes: 'All final quality control tests passed. Product meets pH and viscosity standards. Approved for distribution.'
 * };
 *
 * await releaseBatchUseCase.execute(command);
 * ```
 *
 * @author Qualitrack
 */
export interface ReleaseBatchCommand {
  /**
   * The ISO date string representing the exact moment the batch was officially approved and released.
   */
  releaseDate: string;

  /**
   * Final quality control observations or compliance remarks justifying the approval for release.
   */
  notes: string;
}
