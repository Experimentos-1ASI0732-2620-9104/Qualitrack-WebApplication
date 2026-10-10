import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { IamStore } from '../application/iam.store';
import { environment } from '../../../environments/environment';

/**
 * HTTP interceptor that adds the session token to the requests sent to the QualiTrack platform.
 *
 * @remarks
 * Only requests to the platform (`environment.serverBasePath`) get the `Authorization: Bearer <token>` header; the
 * public `/authentication/` endpoints (sign-in, sign-up, password recovery) and other hosts are left untouched.
 * If the platform answers with the same token still active:
 * - 401: the session has expired, so it is closed and the user goes to `/iam/sign-in`.
 * - 403 with code `ONBOARDING_REQUIRED`: the user must complete an onboarding step, so it goes to `/iam/onboarding`.
 * The error is always re-thrown so the caller can handle it too.
 *
 * @param req - Outgoing request
 * @param next - Next handler of the chain
 * @returns Observable of the HTTP events of the request
 */
export const authenticationInterceptor: HttpInterceptorFn = (req, next) => {
  const api = new URL(environment.serverBasePath, window.location.origin);
  const target = new URL(req.url, window.location.origin);
  if (target.origin !== api.origin || !target.pathname.startsWith(api.pathname + '/')
      || target.pathname.includes('/authentication/')) return next(req);
  const iam = inject(IamStore);
  const router = inject(Router);
  const token = iam.currentToken();
  const authenticated = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authenticated).pipe(catchError((error: HttpErrorResponse) => {
    if (token && iam.currentToken() === token) {
      if (error.status === 401) {
        iam.expireSession();
        void router.navigateByUrl('/iam/sign-in');
      } else if (error.status === 403 && error.error?.code === 'ONBOARDING_REQUIRED') {
        iam.invalidateOnboarding();
        void router.navigateByUrl('/iam/onboarding');
      }
    }
    return throwError(() => error);
  }));
};
