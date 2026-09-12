import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a newly registered user.
 *
 * @remarks
 * This resource belongs to the infrastructure layer and represents the data
 * returned by the backend after a successful sign-up operation.
 *
 * @example
 * ```typescript
 * const resource: SignUpResource = {
 *   id: 1,
 *   username: 'lab.operator'
 * };
 * ```
 */
export interface SignUpResource extends BaseResource {
  /**
   * The unique numeric identifier of the registered user.
   */
  id: number;

  /**
   * The username assigned to the registered user.
   */
  username: string;
}

/**
 * HTTP response contract for the sign-up endpoint.
 *
 * @remarks
 * The current backend response shape matches the SignUpResource structure, so
 * this interface extends it directly for clarity at the API boundary.
 */
export interface SignUpResponse extends SignUpResource {}
