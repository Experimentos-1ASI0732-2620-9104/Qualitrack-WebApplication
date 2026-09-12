import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { IamStore } from '../application/iam.store';
import { environment } from '../../../environments/environment';

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
