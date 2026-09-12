import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents an authenticated user within the Identity and Access Management domain.
 *
 * @remarks
 * In Domain-Driven Design, User is an entity because it has a stable identity
 * represented by its numeric identifier. This entity stores the minimum user
 * information required by the frontend to manage authentication state,
 * authorization checks, and session context.
 *
 * The roles collection determines which application areas and bounded contexts
 * the user can access after authentication.
 *
 * @example
 * ```typescript
 * const user = new User({
 *   id: 1,
 *   username: 'qa.manager',
 *   roles: ['ROLE_QA_MANAGER']
 * });
 *
 * console.log(user.username); // 'qa.manager'
 * ```
 */
export class User implements BaseEntity {
  /**
   * The unique numeric identifier of the authenticated user.
   */
  id: number;

  /**
   * The username used to identify the user in the system.
   */
  username: string;

  /**
   * The authorization roles assigned to the user.
   */
  roles: string[];

  /**
   * Creates a new User entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric user identifier
   * @param params.username - User login name
   * @param params.roles - Authorization roles assigned to the user
   */
  constructor(params: { id: number; username: string; roles: string[] }) {
    this.id = params.id;
    this.username = params.username;
    this.roles = params.roles;
  }
}
