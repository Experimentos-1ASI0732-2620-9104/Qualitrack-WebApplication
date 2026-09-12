/**
 * Data Transfer Object (DTO) for resolving a deviation alert.
 *
 * @remarks
 * In DDD, this request interface represents the payload sent from the
 * infrastructure layer to the API to resolve an existing alert.
 * It contains the user identifier and the resolution notes required by the
 * backend to record the corrective action.
 *
 * @example
 * typescript
 * const request: ResolveAlertRequest = {
 *   resolvedBy: 10,
 *   resolutionNotes: 'Equipment recalibrated and batch quality review completed.'
 * };
 *
 */
export interface ResolveAlertRequest {
  /**
   * The unique numeric identifier of the user resolving the alert.
   */
  resolvedBy: number;

  /**
   * Corrective action or resolution notes.
   */
  resolutionNotes: string;
}
