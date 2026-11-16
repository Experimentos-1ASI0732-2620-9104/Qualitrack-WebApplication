import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';

import { SubscriptionStore } from '../application/subscription.store';
import { planPreselectionGuard } from './plan-preselection-guard';

describe('planPreselectionGuard', () => {
  const selectPlan = vi.fn();

  const run = (query: Record<string, string>) =>
    TestBed.runInInjectionContext(() =>
      planPreselectionGuard({ queryParamMap: convertToParamMap(query) } as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    selectPlan.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: SubscriptionStore, useValue: { selectPlan } }] });
  });

  it('remembers the plan of the link and lets the navigation continue', () => {
    expect(run({ plan: 'ENTERPRISE', billingCycle: 'YEARLY' })).toBe(true);
    expect(selectPlan).toHaveBeenCalledWith({ planCode: 'ENTERPRISE', billingCycle: 'YEARLY' });
  });

  it.each([
    ['without parameters', {}],
    ['without the billing cycle', { plan: 'BASIC' }],
    ['without the plan', { billingCycle: 'MONTHLY' }],
    ['with an unknown billing cycle', { plan: 'BASIC', billingCycle: 'WEEKLY' }],
    ['with a lower-case plan', { plan: 'basic', billingCycle: 'MONTHLY' }],
    ['with a plan that is not a code', { plan: '<script>', billingCycle: 'MONTHLY' }],
    ['with a plan that is too long', { plan: 'A'.repeat(41), billingCycle: 'MONTHLY' }],
  ])('ignores a link %s, and still lets the navigation continue', (_case, query) => {
    expect(run(query)).toBe(true);
    expect(selectPlan).not.toHaveBeenCalled();
  });
});
