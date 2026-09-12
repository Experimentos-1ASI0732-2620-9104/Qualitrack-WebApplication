import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents an active or historical subscription owned by a user or laboratory.
 *
 * @remarks
 * In Domain-Driven Design, Subscription is an entity that tracks the lifecycle
 * of a customer's access to the platform. It connects a customer context with
 * a selected plan and its payment status.
 */
export class Subscription implements BaseEntity {
  /**
   * The unique numeric identifier of the subscription.
   */
  id: number;

  /**
   * The numeric identifier of the user who owns or manages the subscription.
   */
  userId: number;

  /**
   * The numeric identifier of the laboratory associated with the subscription.
   */
  laboratoryId: number;

  /**
   * The business code of the selected subscription plan.
   */
  planCode: string;

  /**
   * The billing cycle of the subscription.
   */
  billingCycle: 'MONTHLY' | 'YEARLY';

  /**
   * The current lifecycle status of the subscription.
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
   * The ISO date string indicating when the current billing period starts.
   */
  currentPeriodStart?: string;

  /**
   * The ISO date string indicating when the current billing period ends.
   */
  currentPeriodEnd?: string;

  /**
   * The ISO date string indicating when the subscription was cancelled.
   */
  cancelledAt?: string;

  /**
   * The numeric identifier of the user who cancelled the subscription.
   */
  cancelledBy?: number;

  /**
   * Creates a new Subscription entity.
   *
   * @param params - Initialization properties
   */
  constructor(params: {
    id: number;
    userId: number;
    laboratoryId: number;
    planCode: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeCheckoutSessionId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelledAt?: string;
    cancelledBy?: number;
  }) {
    this.id = params.id;
    this.userId = params.userId;
    this.laboratoryId = params.laboratoryId;
    this.planCode = params.planCode;
    this.billingCycle = params.billingCycle;
    this.status = params.status;
    this.stripeCustomerId = params.stripeCustomerId;
    this.stripeSubscriptionId = params.stripeSubscriptionId;
    this.stripeCheckoutSessionId = params.stripeCheckoutSessionId;
    this.currentPeriodStart = params.currentPeriodStart;
    this.currentPeriodEnd = params.currentPeriodEnd;
    this.cancelledAt = params.cancelledAt;
    this.cancelledBy = params.cancelledBy;
  }
}
