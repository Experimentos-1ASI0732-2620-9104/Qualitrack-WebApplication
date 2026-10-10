/**
 * Data Transfer Object (DTO) for resolving a deviation alert.
 *
 * @remarks
 * In DDD, this request interface represents the payload sent from the
 * infrastructure layer to the API to resolve an existing alert.
 * It contains the resolution notes required by the backend to record the
 * corrective action; the user who resolves the alert is the authenticated one.
 *
 * @example
 * ```typescript
 * const request: ResolveAlertRequest = {
 *   resolutionNotes: 'Equipment recalibrated and batch quality review completed.'
 * };
 * ```
 */
export interface ResolveAlertRequest {
  /**
   * Corrective action or resolution notes.
   */
  resolutionNotes: string;
}
