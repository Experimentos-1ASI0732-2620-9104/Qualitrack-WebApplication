/**
 * Command for creating a checkout session for a selected subscription plan.
 *
 * @remarks
 * This command belongs to the application layer. It is sent after the user is
 * authenticated so the backend can create a Stripe Checkout Session associated
 * with the current user, laboratory, plan, billing cycle, and redirect URLs.
 */
export interface CreateCheckoutSessionCommand {
  /**
   * The business code of the selected subscription plan.
   */
  planCode: string;

  /**
   * The selected billing cycle.
   */
  billingCycle: 'MONTHLY' | 'YEARLY';

  /**
   * The numeric identifier of the user who is starting checkout.
   */
  userId: number;

  /**
   * Laboratory identifier associated with the subscription.
   */
  laboratoryId: number | null;

  /**
   * URL where Stripe redirects after successful payment.
   */
  successUrl: string;

  /**
   * URL where Stripe redirects after checkout cancellation.
   */
  cancelUrl: string;
}
