import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { IamStore } from '../application/iam.store';
import { onboardingDestination } from '../domain/model/onboarding-state';

type Access = 'operational' | 'laboratory-setup' | 'subscription';

function guard(access: Access): CanActivateFn {
  return (_route, routeState) => {
    const iam = inject(IamStore);
    const router = inject(Router);
    if (!iam.isSignedIn()) {
      return router.createUrlTree(['/iam/sign-in'], { queryParams: { returnUrl: routeState.url } });
    }
    return iam.loadOnboarding().pipe(
      map((state) => {
        if (access === 'subscription') return true;
        const destination = onboardingDestination(state);
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

export const onboardingGuard = guard('operational');
export const laboratorySetupGuard = guard('laboratory-setup');
export const subscriptionGuard = guard('subscription');
