/**
 * Command for registering a new user account.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this command belongs to the
 * application layer. It captures the intent to create a new IAM user with a
 * username, password, assigned authorization roles, and an optional laboratory
 * association.
 *
 * The command is consumed by the application store and mapped into an
 * infrastructure request before being sent to the backend API.
 *
 * @example
 * ```typescript
 * const command: SignUpCommand = {
 *   username: 'lab.operator',
 *   password: 'Secure123',
 *   roles: ['ROLE_LAB_OPERATOR'],
 *   laboratoryId: 1
 * };
 * ```
 */
export interface SignUpCommand {
  /**
   * The username to assign to the new account.
   */
  username: string;

  /**
   * The password for the new account.
   */
  password: string;

  /**
   * Authorization roles assigned to the new user.
   */
  roles: string[];

  /**
   * Laboratory associated with the new user.
   */
  laboratoryId: number | null;
}
