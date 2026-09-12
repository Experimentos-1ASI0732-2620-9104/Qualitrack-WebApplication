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
