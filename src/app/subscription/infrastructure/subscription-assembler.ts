import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionResource, SubscriptionsResponse } from './subscription-response';

/**
 * Assembler for converting between subscription resources and domain entities.
 *
 * @remarks
 * This assembler belongs to the infrastructure layer and maps API resources
 * into Subscription domain entities.
 */
export class SubscriptionAssembler implements BaseAssembler<
  Subscription,
  SubscriptionResource,
  SubscriptionsResponse
> {
  /**
   * Converts a subscription collection response into domain entities.
   *
   * @param response - API response containing subscription resources
   * @returns Array of Subscription domain entities
   */
  toEntitiesFromResponse(response: SubscriptionsResponse): Subscription[] {
    return response.subscriptions.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an array of subscription resources into domain entities.
   *
   * @param resources - Array of subscription resources
   * @returns Array of Subscription domain entities
   */
  toEntitiesFromResources(resources: SubscriptionResource[]): Subscription[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a subscription resource into a domain entity.
   *
   * @param resource - Subscription resource returned by the API
   * @returns Subscription domain entity
   */
  toEntityFromResource(resource: SubscriptionResource): Subscription {
    return new Subscription({
      id: resource.id,
      userId: resource.userId,
      laboratoryId: resource.laboratoryId,
      planCode: resource.planCode,
      billingCycle: resource.billingCycle,
      status: resource.status,
      stripeCustomerId: resource.stripeCustomerId,
      stripeSubscriptionId: resource.stripeSubscriptionId,
      stripeCheckoutSessionId: resource.stripeCheckoutSessionId,
      currentPeriodStart: resource.currentPeriodStart,
      currentPeriodEnd: resource.currentPeriodEnd,
      cancelledAt: resource.cancelledAt,
      cancelledBy: resource.cancelledBy,
    });
  }

  /**
   * Converts a domain entity into a subscription resource.
   *
   * @param entity - Subscription domain entity
   * @returns Subscription resource
   */
  toResourceFromEntity(entity: Subscription): SubscriptionResource {
    return {
      id: entity.id,
      userId: entity.userId,
      laboratoryId: entity.laboratoryId,
      planCode: entity.planCode,
      billingCycle: entity.billingCycle,
      status: entity.status,
      stripeCustomerId: entity.stripeCustomerId,
      stripeSubscriptionId: entity.stripeSubscriptionId,
      stripeCheckoutSessionId: entity.stripeCheckoutSessionId,
      currentPeriodStart: entity.currentPeriodStart,
      currentPeriodEnd: entity.currentPeriodEnd,
      cancelledAt: entity.cancelledAt,
      cancelledBy: entity.cancelledBy,
    };
  }
}
