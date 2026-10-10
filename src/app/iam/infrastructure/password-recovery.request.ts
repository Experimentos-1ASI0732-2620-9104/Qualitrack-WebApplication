/** Body of POST /authentication/password-recovery-requests (TS05). */
export interface PasswordRecoveryRequest {
  /** Username or e-mail of the account. */
  account: string;
}

/** Body of POST /authentication/password-resets (TS06). */
export interface PasswordResetRequest {
  /** Username or e-mail of the account. */
  account: string;
  /** Verification code received by e-mail. */
  code: string;
  /** New password: 8 to 72 characters with letters and digits. */
  newPassword: string;
}
