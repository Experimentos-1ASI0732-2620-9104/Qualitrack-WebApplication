/** Answer to a recovery request; the same whether or not the account exists (TS05). */
export interface PasswordRecoveryAcceptedResource {
  /** Minutes during which the verification code sent by e-mail can be used. */
  codeValidityMinutes: number;
}

/** Answer to a successful password reset (TS06). */
export interface PasswordResetCompletedResource {
  /** Username of the account, to sign in with the new password. */
  username: string;
}
