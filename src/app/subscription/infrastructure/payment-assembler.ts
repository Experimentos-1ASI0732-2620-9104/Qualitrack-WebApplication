import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Payment } from '../domain/model/payment.entity';
import { PaymentResource, PaymentsResponse } from './payment-response';

/**
 * Assembler for converting between payment resources and domain entities.
 *
 * @remarks
 * This assembler belongs to the infrastructure layer and maps API resources
 * into Payment domain entities.
 */
export class PaymentAssembler implements BaseAssembler<Payment, PaymentResource, PaymentsResponse> {
  /**
   * Converts a payment collection response into domain entities.
   *
   * @param response - API response containing payment resources
   * @returns Array of Payment domain entities
   */
  toEntitiesFromResponse(response: PaymentsResponse): Payment[] {
    return response.payments.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an array of payment resources into domain entities.
   *
   * @param resources - Array of payment resources
   * @returns Array of Payment domain entities
   */
  toEntitiesFromResources(resources: PaymentResource[]): Payment[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a payment resource into a domain entity.
   *
   * @param resource - Payment resource returned by the API
   * @returns Payment domain entity
   */
  toEntityFromResource(resource: PaymentResource): Payment {
    return new Payment({
      id: resource.id,
      subscriptionId: resource.subscriptionId,
      provider: resource.provider,
      providerPaymentId: resource.providerPaymentId,
      stripeCheckoutSessionId: resource.stripeCheckoutSessionId,
      amount: resource.amount,
      currency: resource.currency,
      status: resource.status,
      paidAt: resource.paidAt,
    });
  }

  /**
   * Converts a domain entity into a payment resource.
   *
   * @param entity - Payment domain entity
   * @returns Payment resource
   */
  toResourceFromEntity(entity: Payment): PaymentResource {
    return {
      id: entity.id,
      subscriptionId: entity.subscriptionId,
      provider: entity.provider,
      providerPaymentId: entity.providerPaymentId,
      stripeCheckoutSessionId: entity.stripeCheckoutSessionId,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      paidAt: entity.paidAt,
    };
  }
}
