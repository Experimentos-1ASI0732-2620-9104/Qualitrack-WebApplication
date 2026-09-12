/**
 * Command for assigning an authorization role to a user.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this command belongs to the
 * application layer. It represents the intent to grant a specific role to an
 * existing IAM user.
 *
 * This command is useful when user administration features need to update
 * authorization permissions without exposing infrastructure request details to
 * the presentation layer.
 *
 * @example
 * ```typescript
 * const command: AssignRoleCommand = {
 *   userId: 1,
 *   role: 'ROLE_QA_MANAGER'
 * };
 * ```
 */
export interface AssignRoleCommand {
  /**
   * The unique numeric identifier of the user receiving the role.
   */
  userId: number;

  /**
   * The authorization role to assign.
   */
  role: string;
}
