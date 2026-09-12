/**
 * Data Transfer Object (DTO) for acknowledging a deviation alert.
 *
 * @remarks
 * In DDD, this request interface represents the payload sent from the
 * infrastructure layer to the API to acknowledge an existing alert.
 * It contains only the user identifier required by the backend to record
 * who acknowledged the alert.
 *
 * @example
 * typescript
 * const request: AcknowledgeAlertRequest = {
 *   acknowledgedBy: 10
 * };
 *
 */
export interface AcknowledgeAlertRequest {
  /**
   * The unique numeric identifier of the user acknowledging the alert.
   */
  acknowledgedBy: number;
}
