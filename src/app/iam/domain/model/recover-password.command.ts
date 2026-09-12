/**
 * Command for requesting password recovery.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this command belongs to the
 * application layer. It represents the intention to start a password recovery
 * flow for a user account.
 *
 * The command carries the account identifier required by the backend to
 * initiate the recovery process.
 *
 * @example
 * ```typescript
 * const command: RecoverPasswordCommand = {
 *   username: 'qa.manager'
 * };
 * ```
 */
export interface RecoverPasswordCommand {
  /**
   * The username associated with the account that requires password recovery.
   */
  username: string;
}
