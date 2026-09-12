/**
 * Request payload for user registration.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body sent to the backend sign-up endpoint.
 *
 * It contains only the data required by the API to create a new user account.
 *
 * @example
 * ```typescript
 * const request: SignUpRequest = {
 *   username: 'lab.operator',
 *   password: 'Secure123',
 *   roles: ['ROLE_LAB_OPERATOR'],
 *   laboratoryId: 1
 * };
 * ```
 */
export interface SignUpRequest {
  /**
   * The username assigned to the new account.
   */
  username: string;

  /**
   * The password assigned to the new account.
   */
  password: string;

  /**
   * Authorization roles assigned to the new account.
   */
  roles: string[];

  /**
   * Laboratory associated with the new account.
   */
  laboratoryId: number | null;
}
