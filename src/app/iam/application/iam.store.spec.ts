import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { IamApi } from '../infrastructure/iam-api';
import { IamStore } from './iam.store';
import { OnboardingState } from '../domain/model/onboarding-state';

describe('IamStore account lifecycle', () => {
  const api = { signIn: vi.fn(), signUp: vi.fn(), getOnboarding: vi.fn() };
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: IamApi, useValue: api }] });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  function signIn(token = 'fixture-token') {
    api.signIn.mockReturnValue(of({ id: 27, username: 'fixture', token, roles: ['ROLE_QA_MANAGER'], laboratoryId: null }));
    const store = TestBed.inject(IamStore);
    store.signIn({ username: 'fixture', password: 'test-only' }, TestBed.inject(Router));
    return store;
  }

  it('registers without authenticating and routes to sign-in', () => {
    api.signUp.mockReturnValue(of({ id: 27 }));
    const store = TestBed.inject(IamStore);
    store.signUp({ username: 'fixture', password: 'test-only', roles: ['ROLE_QA_MANAGER'], laboratoryId: null }, TestBed.inject(Router));
    expect(store.isSignedIn()).toBe(false);
    expect(store.currentToken()).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/iam/sign-in']);
  });

  it('routes sign-in through the account check, never straight to dashboard', () => {
    const store = signIn();
    expect(store.currentToken()).toBe('fixture-token');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/iam/onboarding']);
    expect(() => store.requireLaboratoryId()).toThrow();
  });

  it('deduplicates concurrent account checks and updates the laboratory from the server', async () => {
    const store = signIn();
    const response = new Subject<OnboardingState>();
    api.getOnboarding.mockReturnValue(response);
    const first = firstValueFrom(store.loadOnboarding());
    const second = firstValueFrom(store.loadOnboarding());
    response.next({ userId: 27, laboratoryId: 42, subscriptionId: 61, subscriptionStatus: 'ACTIVE', nextStep: 'READY' });
    response.complete();
    expect(await first).toEqual(await second);
    expect(api.getOnboarding).toHaveBeenCalledTimes(1);
    expect(store.requireLaboratoryId()).toBe(42);
    await firstValueFrom(store.loadOnboarding());
    expect(api.getOnboarding).toHaveBeenCalledTimes(1);
  });

  it('does not apply an old response after a session change', async () => {
    const store = signIn();
    const response = new Subject<OnboardingState>();
    api.getOnboarding.mockReturnValue(response);
    const pending = firstValueFrom(store.loadOnboarding()).catch(() => null);
    store.expireSession();
    signIn('second-fixture-token');
    response.next({ userId: 27, laboratoryId: 42, subscriptionId: 61, subscriptionStatus: 'ACTIVE', nextStep: 'READY' });
    response.complete();
    expect(await pending).toBeNull();
    expect(store.currentToken()).toBe('second-fixture-token');
    expect(store.currentLaboratoryId()).toBeNull();
  });

  it('rejects a malformed persisted session and a forged laboratory fallback', () => {
    localStorage.setItem('token', 'not-a-jwt');
    localStorage.setItem('userId', '27');
    localStorage.setItem('laboratoryId', '1');
    const store = TestBed.inject(IamStore);
    expect(store.isSignedIn()).toBe(false);
    expect(store.currentLaboratoryId()).toBeNull();
  });
});
