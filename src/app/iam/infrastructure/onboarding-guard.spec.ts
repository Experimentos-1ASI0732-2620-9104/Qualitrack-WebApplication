import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { IamStore } from '../application/iam.store';
import { OnboardingState } from '../domain/model/onboarding-state';
import { laboratorySetupGuard, onboardingGuard, subscriptionGuard } from './onboarding-guard';

describe('Account onboarding guards', () => {
  const iam = { isSignedIn: vi.fn(), loadOnboarding: vi.fn() };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: IamStore, useValue: iam }] });
    iam.isSignedIn.mockReturnValue(true);
    iam.loadOnboarding.mockReset();
  });

  async function run(guard = onboardingGuard): Promise<string | boolean> {
    const result = TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot,
      { url: '/dashboard' } as RouterStateSnapshot));
    const value = isObservable(result) ? await firstValueFrom(result) : await result;
    return value instanceof UrlTree ? TestBed.inject(Router).serializeUrl(value) : value as boolean;
  }

  it('redirects an anonymous direct URL to sign-in without requesting account data', async () => {
    iam.isSignedIn.mockReturnValue(false);
    expect(await run()).toBe('/iam/sign-in?returnUrl=%2Fdashboard');
    expect(iam.loadOnboarding).not.toHaveBeenCalled();
  });

  for (const [status, labId, destination] of [
    ['INACTIVE', null, '/subscriptions/plans'],
    ['INACTIVE', 42, '/subscriptions/plans'],
    ['ACTIVE', null, '/laboratories/create'],
    ['ACTIVE', 42, true],
  ] as const) {
    it(`routes ${status} with laboratory ${labId} to ${destination}`, async () => {
      iam.loadOnboarding.mockReturnValue(of({ userId: 27, laboratoryId: labId,
        subscriptionId: null, subscriptionStatus: status,
        nextStep: status !== 'ACTIVE' ? 'SUBSCRIPTION' : labId === null ? 'LABORATORY' : 'READY' } as OnboardingState));
      expect(await run()).toBe(destination);
    });
  }

  it('allows payment pages but not laboratory creation for an unpaid account', async () => {
    iam.loadOnboarding.mockReturnValue(of({ subscriptionStatus: 'INACTIVE', laboratoryId: null }));
    expect(await run(subscriptionGuard)).toBe(true);
    expect(await run(laboratorySetupGuard)).toBe('/subscriptions/plans');
  });

  it('shows a retry page on a server error instead of allowing the dashboard', async () => {
    iam.loadOnboarding.mockReturnValue(throwError(() => new Error('offline')));
    expect(await run()).toBe('/iam/onboarding');
  });
});
