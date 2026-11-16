import { InjectionToken, Signal, signal } from '@angular/core';

/**
 * Whether a user is signed in, for the shared views that change their links with the session.
 *
 * @remarks
 * `shared` does not import any bounded context, so it cannot read `IamStore`. The composition root
 * (`app.config.ts`) provides this token with the session signal of IAM; without that provider it is `false`.
 */
export const SIGNED_IN = new InjectionToken<Signal<boolean>>('SIGNED_IN', {
  providedIn: 'root',
  factory: () => signal(false).asReadonly(),
});
