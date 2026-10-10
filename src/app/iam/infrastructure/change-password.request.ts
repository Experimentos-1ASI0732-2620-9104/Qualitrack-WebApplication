/**
 * Request body of POST /users/me/password-changes.
 */
export interface ChangePasswordRequest {
  /**
   * Password used to sign in (the temporary password of a new staff account).
   */
  currentPassword: string;

  /**
   * New password: 8 to 72 characters with letters and digits.
   */
  newPassword: string;
}
