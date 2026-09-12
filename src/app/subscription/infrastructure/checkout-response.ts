/**
 * Resource representation of a checkout session.
 *
 * @remarks
 * This resource represents the backend response after creating a checkout
 * session with Stripe. It does not extend BaseResource because the backend
 * returns a transient redirect payload without a numeric id.
 */
export interface CheckoutSessionResource {
  /**
   * URL where the user should be redirected to complete payment.
   */
  checkoutUrl: string;

  /**
   * Optional external checkout session identifier.
   */
  checkoutSessionId?: string;
}

/**
 * HTTP response contract for checkout session creation.
 *
 * @remarks
 * The backend currently returns the checkout session directly without an
 * envelope or numeric id.
 */
export interface CheckoutSessionResponse {
  /**
   * URL where the user should be redirected to complete payment.
   */
  checkoutUrl: string;

  /**
   * Optional external checkout session identifier.
   */
  checkoutSessionId?: string;
}
