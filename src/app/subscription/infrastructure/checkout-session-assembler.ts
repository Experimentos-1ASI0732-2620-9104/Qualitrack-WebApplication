import { CheckoutSessionResource, CheckoutSessionResponse } from './checkout-response';

/**
 * Assembler for converting checkout session API responses into resources.
 *
 * @remarks
 * Checkout sessions are not modeled as domain entities in the frontend because
 * they represent a short-lived infrastructure interaction with Stripe.
 */
export class CheckoutSessionAssembler {
  /**
   * Converts a checkout session response into a checkout session resource.
   *
   * @param response - API response returned after checkout session creation
   * @returns CheckoutSession resource
   */
  toResourceFromResponse(response: CheckoutSessionResponse): CheckoutSessionResource {
    return {
      checkoutUrl: response.checkoutUrl,
      checkoutSessionId: response.checkoutSessionId,
    };
  }
}
