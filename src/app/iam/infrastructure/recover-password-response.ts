import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a password recovery request result.
 *
 * @remarks
 * This resource belongs to the infrastructure layer and represents the backend
 * response after requesting password recovery for a user account.
 *
 * @example
 * ```typescript
 * const resource: RecoverPasswordResource = {
 *   id: 1,
 *   message: 'Password recovery instructions were sent.'
 * };
 * ```
 */
export interface RecoverPasswordResource extends BaseResource {
  /**
   * Human-readable message returned by the backend.
   */
  message: string;
}

/**
 * HTTP response contract for the password recovery endpoint.
 *
 * @remarks
 * The current backend response shape matches the RecoverPasswordResource
 * structure, so this interface extends it directly for clarity at the API boundary.
 */
export interface RecoverPasswordResponse extends BaseResource, RecoverPasswordResource {}
