/**
 * Command to replace the username and the e-mail of the signed-in account, confirmed with the current password.
 */
export interface UpdateAccountCommand {
  /** New username. */
  username: string;
  /** New e-mail. */
  email: string;
  /** Current password, required to confirm the change. */
  currentPassword: string;
}
