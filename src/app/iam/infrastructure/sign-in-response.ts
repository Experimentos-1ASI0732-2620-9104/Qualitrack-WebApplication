import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of an authenticated user session.
 *
 * @remarks
 * This resource belongs to the infrastructure layer and represents the data
 * returned by the backend after a successful sign-in operation.
 *
 * It includes the authenticated user's identity, authorization roles, associated
 * laboratory identifier, and JWT token required for subsequent authenticated
 * HTTP requests.
 *
 * @example
 * ```typescript
 * const resource: SignInResource = {
 *   id: 1,
 *   username: 'qa.manager',
 *   roles: ['ROLE_QA_MANAGER'],
 *   laboratoryId: 1,
 *   token: 'jwt-token'
 * };
 * ```
 */
export interface SignInResource extends BaseResource {
  /**
   * The unique numeric identifier of the authenticated user.
   */
  id: number;

  /**
   * The username of the authenticated user.
   */
  username: string;

  /**
   * Authorization roles assigned to the authenticated user.
   */
  roles: string[];

  /**
   * Laboratory associated with the authenticated user.
   */
  laboratoryId: number | null;

  /**
   * JWT access token returned by the authentication service.
   */
  token: string;
}

/**
 * HTTP response contract for the sign-in endpoint.
 *
 * @remarks
 * The current backend response shape matches the SignInResource structure, so
 * this interface extends it directly for clarity at the API boundary.
 */
export interface SignInResponse extends SignInResource {}
