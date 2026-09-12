/**
 * Command for signing in an existing user.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this command belongs to the
 * application layer. It represents the user's intention to authenticate by
 * providing credentials through the presentation layer.
 *
 * The command is later mapped into an infrastructure request DTO before being
 * sent to the backend API.
 *
 * @example
 * ```typescript
 * const command: SignInCommand = {
 *   username: 'qa.manager',
 *   password: 'Secure123'
 * };
 * ```
 */
export interface SignInCommand {
  /**
   * The username used to authenticate the user.
   */
  username: string;

  /**
   * The password associated with the user account.
   */
  password: string;
}
