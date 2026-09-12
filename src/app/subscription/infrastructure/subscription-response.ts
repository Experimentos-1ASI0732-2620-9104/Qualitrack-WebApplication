import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a customer subscription.
 *
 * @remarks
 * This resource belongs to the infrastructure layer and represents the
 * subscription data returned by the backend API.
 */
export interface SubscriptionResource extends BaseResource {
  /**
   * The unique numeric identifier of the subscription.
   */
  id: number;

  /**
   * The numeric identifier of the subscription owner.
   */
  userId: number;

  /**
   * The numeric identifier of the related laboratory.
   */
  laboratoryId: number;

  /**
   * Business code of the selected subscription plan.
   */
  planCode: string;

  /**
   * Billing cycle of the selected subscription.
   */
  billingCycle: 'MONTHLY' | 'YEARLY';

  /**
   * Current lifecycle status of the subscription.
   */
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

  /**
   * Stripe customer identifier.
   */
  stripeCustomerId?: string;

  /**
   * Stripe subscription identifier.
   */
  stripeSubscriptionId?: string;

  /**
   * Stripe checkout session identifier.
   */
  stripeCheckoutSessionId?: string;

  /**
   * ISO date string indicating when the current period starts.
   */
  currentPeriodStart?: string;

  /**
   * ISO date string indicating when the current period ends.
   */
  currentPeriodEnd?: string;

  /**
   * ISO date string indicating when the subscription was cancelled.
   */
  cancelledAt?: string;

  /**
   * Numeric identifier of the user who cancelled the subscription.
   */
  cancelledBy?: number;
}

/**
 * Response envelope for subscription collection queries.
 */
export interface SubscriptionsResponse extends BaseResponse {
  /**
   * Array of subscription resources.
   */
  subscriptions: SubscriptionResource[];
}
