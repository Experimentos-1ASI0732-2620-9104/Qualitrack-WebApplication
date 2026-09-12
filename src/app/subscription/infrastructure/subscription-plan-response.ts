import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a subscription plan for API communication.
 *
 * @remarks
 * This resource belongs to the infrastructure layer and represents the plan
 * data as returned by the backend subscription API.
 */
export interface SubscriptionPlanResource extends BaseResource {
  /**
   * The unique numeric identifier of the subscription plan.
   */
  id: number;

  /**
   * Stable business code of the plan.
   */
  code: string;

  /**
   * Display name of the plan.
   */
  name: string;

  /**
   * Short description of the plan.
   */
  description: string;

  /**
   * Plan price amount.
   */
  amount: number;

  /**
   * Currency used for the plan price.
   */
  currency: string;

  /**
   * Billing cycle for the plan.
   */
  billingCycle: 'MONTHLY' | 'YEARLY';

  /**
   * Stripe Price ID associated with this plan.
   */
  stripePriceId: string;

  /**
   * Maximum number of users allowed by the plan.
   */
  maxUsers: number;

  /**
   * Maximum number of equipment records; null means unlimited.
   */
  maxEquipment: number | null;

  /**
   * Indicates whether the plan is available for purchase.
   */
  active: boolean;
}

/**
 * Response envelope for subscription plan collection queries.
 */
export interface SubscriptionPlansResponse extends BaseResponse {
  /**
   * Array of subscription plan resources.
   */
  plans: SubscriptionPlanResource[];
}
