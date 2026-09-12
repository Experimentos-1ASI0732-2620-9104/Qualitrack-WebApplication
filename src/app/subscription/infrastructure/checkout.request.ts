/**
 * Request payload for creating a subscription checkout session.
 *
 * @remarks
 * This request belongs to the infrastructure layer and represents the HTTP body
 * sent to the backend checkout endpoint.
 */
export interface CreateCheckoutSessionRequest {
  /**
   * Numeric identifier of the user starting checkout.
   */
  userId: number;

  /**
   * Laboratory identifier associated with the subscription.
   */
  laboratoryId: number | null;

  /**
   * Business code of the selected subscription plan.
   */
  planCode: string;

  /**
   * Selected billing cycle.
   */
  billingCycle: 'MONTHLY' | 'YEARLY';

  /**
   * URL where Stripe redirects after successful payment.
   */
  successUrl: string;

  /**
   * URL where Stripe redirects after checkout cancellation.
   */
  cancelUrl: string;
}
