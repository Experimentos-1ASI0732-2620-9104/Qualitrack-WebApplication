import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { IamStore } from '../application/iam.store';
import { iamGuard, visitorGuard } from './iam-guard';

describe('session guards', () => {
  const signedIn = signal(false);
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/alerts/7' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: IamStore, useValue: { isSignedIn: signed } }],
    });
  });

  const signed = signedIn.asReadonly();
  const urlOf = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  describe('visitorGuard', () => {
    it('opens the page to visitors', () => {
      signedIn.set(false);
      expect(TestBed.runInInjectionContext(() => visitorGuard(route, state))).toBe(true);
    });

    it('sends whoever already has a session to the dashboard, instead of offering to sign in', () => {
      signedIn.set(true);
      expect(urlOf(TestBed.runInInjectionContext(() => visitorGuard(route, state)))).toBe('/dashboard');
    });
  });

  describe('iamGuard', () => {
    it('sends visitors to sign in, remembering where they were going', () => {
      signedIn.set(false);
      expect(urlOf(TestBed.runInInjectionContext(() => iamGuard(route, state)))).toBe('/iam/sign-in?returnUrl=%2Falerts%2F7');
    });

    it('opens the page to whoever has a session', () => {
      signedIn.set(true);
      expect(TestBed.runInInjectionContext(() => iamGuard(route, state))).toBe(true);
    });
  });
});
