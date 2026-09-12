import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a subscription payment.
 *
 * @remarks
 * This resource belongs to the infrastructure layer and represents the payment
 * data returned by the backend API.
 */
export interface PaymentResource extends BaseResource {
  /**
   * The unique numeric identifier of the payment.
   */
  id: number;

  /**
   * The numeric identifier of the related subscription.
   */
  subscriptionId: number;

  /**
   * External payment provider name.
   */
  provider: string;

  /**
   * External payment provider transaction identifier.
   */
  providerPaymentId?: string;

  /**
   * Stripe checkout session identifier.
   */
  stripeCheckoutSessionId?: string;

  /**
   * Payment amount.
   */
  amount: number;

  /**
   * Payment currency.
   */
  currency: string;

  /**
   * Current payment status.
   */
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';

  /**
   * ISO date string indicating when the payment was paid or recorded.
   */
  paidAt?: string;
}

/**
 * Response envelope for payment collection queries.
 */
export interface PaymentsResponse extends BaseResponse {
  /**
   * Array of payment resources.
   */
  payments: PaymentResource[];
}
