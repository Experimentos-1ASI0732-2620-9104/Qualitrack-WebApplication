import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { SubscriptionStore } from '../application/subscription.store';

const PLAN_CODE = /^[A-Z0-9_]{1,40}$/;

/**
 * Remembers the plan that the website put in the link (`?plan=BASIC&billingCycle=YEARLY`), so the sign-up, sign-in and
 * onboarding that follow can end at its checkout. It never blocks the navigation: a missing or invalid pair is ignored.
 */
export const planPreselectionGuard: CanActivateFn = (route) => {
  const plan = route.queryParamMap.get('plan');
  const billingCycle = route.queryParamMap.get('billingCycle');
  if (plan && PLAN_CODE.test(plan) && (billingCycle === 'MONTHLY' || billingCycle === 'YEARLY')) {
    inject(SubscriptionStore).selectPlan({ planCode: plan, billingCycle });
  }
  return true;
};
