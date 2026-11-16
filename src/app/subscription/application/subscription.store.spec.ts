import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError, of } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { SubscriptionApi } from '../infrastructure/subscription-api';
import { SubscriptionStore } from './subscription.store';

describe('SubscriptionStore', () => {
  const beforeSignOut = vi.fn();
  const createCheckoutSession = vi.fn();
  const getCurrentSubscription = vi.fn();
  const getPlans = vi.fn();
  const command = {
    planCode: 'BASIC', billingCycle: 'MONTHLY' as const, userId: 4, laboratoryId: null,
    successUrl: 'http://x/success', cancelUrl: 'http://x/cancel',
  };

  function create() {
    TestBed.configureTestingModule({
      providers: [
        { provide: SubscriptionApi, useValue: { createCheckoutSession, getCurrentSubscription, getPlans } },
        { provide: IamStore, useValue: { beforeSignOut } },
        { provide: Router, useValue: {} },
      ],
    });
    return TestBed.inject(SubscriptionStore);
  }

  beforeEach(() => {
    sessionStorage.clear();
    beforeSignOut.mockClear();
    createCheckoutSession.mockReset();
    getCurrentSubscription.mockReset();
    getPlans.mockReset();
  });

  describe('findPlanSwitch', () => {
    const paid = { planCode: 'BASIC', billingCycle: 'MONTHLY', status: 'ACTIVE' };
    const catalog = [{ code: 'ENTERPRISE', name: 'Enterprise', billingPeriod: 'YEARLY' }];

    function choose(planCode: string, billingCycle: 'MONTHLY' | 'YEARLY') {
      const store = create();
      store.selectPlan({ planCode, billingCycle });
      return store;
    }

    beforeEach(() => {
      getCurrentSubscription.mockReturnValue(of(paid));
      getPlans.mockReturnValue(of(catalog));
    });

    it('asks nothing when no plan was chosen', async () => {
      expect(await create().findPlanSwitch(42)).toBeNull();
      expect(getCurrentSubscription).not.toHaveBeenCalled();
      expect(getPlans).not.toHaveBeenCalled();
    });

    it('finds the switch to another plan, and spends the choice', async () => {
      const store = choose('ENTERPRISE', 'YEARLY');
      expect(await store.findPlanSwitch(42)).toEqual({
        chosen: { planCode: 'ENTERPRISE', billingCycle: 'YEARLY' },
        current: paid,
        plans: catalog,
      });
      expect(getCurrentSubscription).toHaveBeenCalledWith(42);
      expect(store.selectedPlanCode()).toBeNull();
    });

    it('takes the same plan with another billing cycle as a different plan', async () => {
      expect(await choose('BASIC', 'YEARLY').findPlanSwitch(42)).not.toBeNull();
    });

    it('has nothing to say about the plan already paid for, and spends the choice', async () => {
      const store = choose('BASIC', 'MONTHLY');
      expect(await store.findPlanSwitch(42)).toBeNull();
      expect(store.selectedPlanCode()).toBeNull();
    });

    it('still finds the switch when the catalog cannot be read', async () => {
      getPlans.mockReturnValue(throwError(() => new Error('Service unavailable')));
      expect((await choose('ENTERPRISE', 'YEARLY').findPlanSwitch(42))?.plans).toEqual([]);
    });

    it('keeps the choice for the plans view when there is no active subscription', async () => {
      getCurrentSubscription.mockReturnValue(throwError(() => new Error('Resource not found')));
      const store = choose('ENTERPRISE', 'YEARLY');
      expect(await store.findPlanSwitch(42)).toBeNull();
      expect(store.selectedPlanCode()).toBe('ENTERPRISE');
    });
  });

  describe('loadCurrentPlan', () => {
    it('keeps the active subscription of the laboratory without the loading state of the plans', () => {
      const paid = { id: 9, laboratoryId: 42, planCode: 'BASIC', billingCycle: 'MONTHLY', status: 'ACTIVE' };
      getCurrentSubscription.mockReturnValue(of(paid));
      const store = create();

      store.loadCurrentPlan(42);

      expect(getCurrentSubscription).toHaveBeenCalledWith(42);
      expect(store.currentSubscription()).toBe(paid);
      expect(store.isLoading()).toBe(false);
    });

    it('forgets the subscription read before when the new one cannot be read, and shows no error', () => {
      getCurrentSubscription.mockReturnValueOnce(of({ id: 9, laboratoryId: 42, status: 'ACTIVE' }));
      getCurrentSubscription.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
      const store = create();

      store.loadCurrentPlan(42);
      store.loadCurrentPlan(42);

      expect(store.currentSubscription()).toBeNull();
      expect(store.error()).toBeNull();
      expect(store.isLoading()).toBe(false);
    });
  });

  it('forgets the chosen plan when the person signs out', () => {
    const store = create();
    store.selectPlan({ planCode: 'BASIC', billingCycle: 'MONTHLY' });
    beforeSignOut.mock.calls[0][0]();
    expect(store.selectedPlanCode()).toBeNull();
    expect(sessionStorage.getItem('selectedPlanCode')).toBeNull();
  });

  it('spends the chosen plan once the checkout session exists', () => {
    createCheckoutSession.mockReturnValue(of({ checkoutUrl: '' }));
    const store = create();
    store.selectPlan({ planCode: 'BASIC', billingCycle: 'MONTHLY' });
    store.createCheckoutSession(command);
    expect(store.selectedPlanCode()).toBeNull();
  });

  it('explains a 409 with the already-subscribed notice and keeps the chosen plan', () => {
    createCheckoutSession.mockReturnValue(throwError(() => new ApiError('Conflict', 409)));
    const store = create();
    store.selectPlan({ planCode: 'BASIC', billingCycle: 'MONTHLY' });
    store.createCheckoutSession(command);
    expect(store.error()).toBe('subscription.plans.already-active');
    expect(store.isLoading()).toBe(false);
    expect(store.selectedPlanCode()).toBe('BASIC');
  });

  it('keeps the generic message for any other failure', () => {
    createCheckoutSession.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const store = create();
    store.createCheckoutSession(command);
    expect(store.error()).toBe('Failed to create checkout session');
  });
});
