import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { IamStore } from '../application/iam.store';
import { onboardingDestination } from '../domain/model/onboarding-state';

/**
 * Kind of view a guard protects:
 * - `operational`: the views of daily work; they need the onboarding completed.
 * - `laboratory-setup`: the creation of the laboratory, the last onboarding step.
 * - `subscription`: the plans and checkout; quality managers can always open them.
 * - `password-change`: the change of the temporary password, the first onboarding step.
 */
type Access = 'operational' | 'laboratory-setup' | 'subscription' | 'password-change';

/**
 * Builds a guard that lets the user in only if the view matches their onboarding step.
 *
 * @remarks
 * Without session the user goes to `/iam/sign-in` with the requested URL as `returnUrl`. Otherwise the onboarding
 * state is read from the platform and, if the view is not the one {@link onboardingDestination} resolves, the user is
 * redirected there (a pending password change always comes first). If the state cannot be read, the user goes to
 * `/iam/onboarding`, which shows the error and lets them retry.
 *
 * @param access - Kind of view the guard protects
 * @returns The route guard
 */
function guard(access: Access): CanActivateFn {
  return (_route, routeState) => {
    const iam = inject(IamStore);
    const router = inject(Router);
    if (!iam.isSignedIn()) {
      return router.createUrlTree(['/iam/sign-in'], { queryParams: { returnUrl: routeState.url } });
    }
    return iam.loadOnboarding().pipe(
      map((state) => {
        const destination = onboardingDestination(state, iam.canManageQuality());
        if (access === 'password-change') return destination === '/iam/change-password' || router.parseUrl(destination);
        if (destination === '/iam/change-password') return router.parseUrl(destination);
        if (access === 'subscription') return iam.canManageQuality() || router.parseUrl(destination);
        if (access === 'operational' && destination === '/dashboard') return true;
        if (access === 'laboratory-setup' && destination === '/laboratories/create') return true;
        return router.parseUrl(destination);
      }),
      catchError(() => of(router.parseUrl(
        iam.isSignedIn() ? '/iam/onboarding' : '/iam/sign-in',
      ))),
    );
  };
}

/** Views of daily work: they open only when the onboarding is completed. */
export const onboardingGuard = guard('operational');
/** Creation of the laboratory: it opens only while that is the pending step. */
export const laboratorySetupGuard = guard('laboratory-setup');
/** Plans and checkout of the subscription: quality managers only, once the password was changed. */
export const subscriptionGuard = guard('subscription');
/** Change of the temporary password: it opens only while that is the pending step. */
export const passwordChangeGuard = guard('password-change');
