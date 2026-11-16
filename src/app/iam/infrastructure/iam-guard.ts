import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { IamStore } from '../application/iam.store';

/**
 * Route guard that protects views requiring an authenticated session.
 *
 * @remarks
 * Allows navigation only when the IAM store has an active signed-in session.
 * Unauthenticated users are redirected to the sign-in view.
 */
export const iamGuard: CanActivateFn = (_route, state) => {
  const store = inject(IamStore);
  const router = inject(Router);

  if (store.isSignedIn()) {
    return true;
  }

  return router.createUrlTree(['/iam/sign-in'], { queryParams: { returnUrl: state.url } });
};

/**
 * Route guard of the pages meant for visitors: the home page, sign-in, sign-up and password recovery.
 *
 * @remarks
 * A session survives closing the browser, so whoever still has one goes to the dashboard, which takes them to the
 * pending step of their onboarding. Otherwise these pages would offer to sign in next to the signed-in user.
 */
export const visitorGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const router = inject(Router);

  return store.isSignedIn() ? router.createUrlTree(['/dashboard']) : true;
};
