/**
 * Request payload for updating a subscription status.
 */
export interface UpdateSubscriptionStatusRequest {
  /**
   * New subscription status.
   */
  status: 'CANCELLED';

  /**
   * Numeric identifier of the user performing the cancellation.
   */
  cancelledBy: number;
}
