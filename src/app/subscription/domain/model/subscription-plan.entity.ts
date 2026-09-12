import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a subscription plan offered by the application.
 *
 * @remarks
 * In Domain-Driven Design, SubscriptionPlan is an entity that defines the
 * commercial offer available to customers. It includes pricing, billing
 * frequency, operational limits, and the features enabled by the plan.
 */
export class SubscriptionPlan implements BaseEntity {
  /**
   * The unique numeric identifier of the subscription plan.
   */
  id: number;

  /**
   * The stable business code of the plan.
   */
  code: string;

  /**
   * The display name of the subscription plan.
   */
  name: string;

  /**
   * A short description of the plan.
   */
  description: string;

  /**
   * The plan price amount.
   */
  priceAmount: number;

  /**
   * The currency used for the plan price.
   */
  currency: string;

  /**
   * The billing period for the plan.
   */
  billingPeriod: 'MONTHLY' | 'YEARLY';

  /**
   * Maximum number of users allowed by the plan.
   */
  maxUsers: number;

  /**
   * Maximum number of equipment records; null means unlimited.
   */
  maxEquipment: number | null;

  /**
   * List of features included in the plan.
   */
  features: string[];

  /**
   * Indicates whether the plan is currently available for purchase.
   */
  active: boolean;

  /**
   * Creates a new SubscriptionPlan entity.
   *
   * @param params - Initialization properties
   */
  constructor(params: {
    id: number;
    code: string;
    name: string;
    description: string;
    priceAmount: number;
    currency: string;
    billingPeriod: 'MONTHLY' | 'YEARLY';
    maxUsers: number;
    maxEquipment: number | null;
    features: string[];
    active: boolean;
  }) {
    this.id = params.id;
    this.code = params.code;
    this.name = params.name;
    this.description = params.description;
    this.priceAmount = params.priceAmount;
    this.currency = params.currency;
    this.billingPeriod = params.billingPeriod;
    this.maxUsers = params.maxUsers;
    this.maxEquipment = params.maxEquipment;
    this.features = params.features;
    this.active = params.active;
  }
}
