/**
 * Command to set a new password with the verification code received by e-mail (US17).
 */
export interface ResetPasswordCommand {
  /** Username or e-mail used to request the code. */
  account: string;
  /** Verification code of 6 digits. */
  code: string;
  /** New password: 8 to 72 characters with letters and numbers. */
  newPassword: string;
}
