/**
 * Request payload for password recovery.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body sent to the backend password recovery endpoint.
 *
 * @example
 * ```typescript
 * const request: RecoverPasswordRequest = {
 *   username: 'qa.manager'
 * };
 * ```
 */
export interface RecoverPasswordRequest {
  /**
   * The username associated with the account that requires password recovery.
   */
  username: string;
}
