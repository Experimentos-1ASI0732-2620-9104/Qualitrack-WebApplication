import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a payment attempt or completed payment for a subscription.
 *
 * @remarks
 * In Domain-Driven Design, Payment is an entity that records the financial
 * transaction associated with a subscription checkout process.
 */
export class Payment implements BaseEntity {
  /**
   * The unique numeric identifier of the payment.
   */
  id: number;

  /**
   * The numeric identifier of the related subscription.
   */
  subscriptionId: number;

  /**
   * The external payment provider name.
   */
  provider: string;

  /**
   * The external payment provider transaction identifier.
   */
  providerPaymentId?: string;

  /**
   * Stripe checkout session identifier.
   */
  stripeCheckoutSessionId?: string;

  /**
   * The payment amount.
   */
  amount: number;

  /**
   * The payment currency.
   */
  currency: string;

  /**
   * The current status of the payment.
   */
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';

  /**
   * The ISO date string indicating when the payment was paid or recorded.
   */
  paidAt?: string;

  /**
   * Creates a new Payment entity.
   *
   * @param params - Initialization properties
   */
  constructor(params: {
    id: number;
    subscriptionId: number;
    provider: string;
    providerPaymentId?: string;
    stripeCheckoutSessionId?: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';
    paidAt?: string;
  }) {
    this.id = params.id;
    this.subscriptionId = params.subscriptionId;
    this.provider = params.provider;
    this.providerPaymentId = params.providerPaymentId;
    this.stripeCheckoutSessionId = params.stripeCheckoutSessionId;
    this.amount = params.amount;
    this.currency = params.currency;
    this.status = params.status;
    this.paidAt = params.paidAt;
  }
}
