/**
 * Request payload for user authentication.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body sent to the backend sign-in endpoint.
 *
 * It is created from a SignInCommand before performing the API call.
 *
 * @example
 * ```typescript
 * const request: SignInRequest = {
 *   username: 'qa.manager',
 *   password: 'Secure123'
 * };
 * ```
 */
export interface SignInRequest {
  /**
   * The username used to authenticate the account.
   */
  username: string;

  /**
   * The password associated with the user account.
   */
  password: string;
}
