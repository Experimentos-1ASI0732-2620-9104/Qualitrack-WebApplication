/**
 * Body of PUT /users/me: the username and e-mail of the account, confirmed with the current password.
 */
export interface UpdateAccountRequest {
  /** New username, already trimmed. */
  username: string;

  /** New e-mail, already trimmed. */
  email: string;

  /** Current password of the account. */
  currentPassword: string;
}
