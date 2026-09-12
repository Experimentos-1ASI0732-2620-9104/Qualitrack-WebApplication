import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';
import { SubscriptionPlanResource, SubscriptionPlansResponse } from './subscription-plan-response';

/**
 * Assembler for converting between subscription plan resources and domain entities.
 *
 * @remarks
 * This assembler belongs to the infrastructure layer and protects the domain
 * model from API response shape details.
 */
export class SubscriptionPlanAssembler implements BaseAssembler<
  SubscriptionPlan,
  SubscriptionPlanResource,
  SubscriptionPlansResponse
> {
  /**
   * Converts a subscription plans response into domain entities.
   *
   * @param response - API response containing plan resources
   * @returns Array of SubscriptionPlan domain entities
   */
  toEntitiesFromResponse(response: SubscriptionPlansResponse): SubscriptionPlan[] {
    return response.plans.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an array of plan resources into domain entities.
   *
   * @param resources - Array of plan resources
   * @returns Array of SubscriptionPlan domain entities
   */
  toEntitiesFromResources(resources: SubscriptionPlanResource[]): SubscriptionPlan[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a plan resource into a domain entity.
   *
   * @param resource - Plan resource returned by the API
   * @returns SubscriptionPlan domain entity
   */
  toEntityFromResource(resource: SubscriptionPlanResource): SubscriptionPlan {
    return new SubscriptionPlan({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      description: resource.description,
      priceAmount: resource.amount,
      currency: resource.currency,
      billingPeriod: resource.billingCycle,
      maxUsers: resource.maxUsers,
      maxEquipment: resource.maxEquipment,
      features: this.buildFeatures(resource),
      active: resource.active,
    });
  }

  /**
   * Converts a domain entity into a plan resource.
   *
   * @param entity - SubscriptionPlan domain entity
   * @returns SubscriptionPlan resource
   */
  toResourceFromEntity(entity: SubscriptionPlan): SubscriptionPlanResource {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      amount: entity.priceAmount,
      currency: entity.currency,
      billingCycle: entity.billingPeriod,
      stripePriceId: '',
      maxUsers: entity.maxUsers,
      maxEquipment: entity.maxEquipment,
      active: entity.active,
    };
  }

  /**
   * Builds display features from backend plan limits.
   *
   * @param resource - Plan resource returned by the API
   * @returns Human-readable feature list
   */
  private buildFeatures(resource: SubscriptionPlanResource): string[] {
    return [
      `${resource.maxUsers} users included`,
      resource.maxEquipment === null
        ? 'Unlimited equipment connections'
        : `${resource.maxEquipment} equipment records`,
      `${resource.billingCycle.toLowerCase()} billing`,
    ];
  }
}
