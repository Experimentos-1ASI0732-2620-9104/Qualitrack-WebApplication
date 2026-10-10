/**
 * Onboarding state of the signed-in user, as the platform sends it (GET /users/me/onboarding).
 *
 * @remarks
 * Before using the platform a user goes through these steps, in order: change the temporary password (staff
 * registered by their quality manager), have an active subscription and set up the laboratory. The guards read this
 * state to decide which view the user can open.
 */
export interface OnboardingState {
  /** Numeric id of the signed-in user. */
  userId: number;
  /** Numeric id of the laboratory of the user, or null before it is set up. */
  laboratoryId: number | null;
  /** Numeric id of the subscription of the laboratory, or null without subscription. */
  subscriptionId: number | null;
  /** Whether the subscription of the laboratory is active. */
  subscriptionStatus: 'ACTIVE' | 'INACTIVE';
  /** Next step the user must complete, or `READY` when the onboarding is completed. */
  nextStep: 'PASSWORD_CHANGE' | 'SUBSCRIPTION' | 'LABORATORY' | 'READY';
}

/** Where a staff member waits while the laboratory subscription is not active. */
export const SUBSCRIPTION_PAUSED = '/iam/onboarding';

/**
 * Resolves the view that the user must see next.
 *
 * @param state - onboarding state returned by the platform
 * @param managesSubscription - whether the user can subscribe (quality managers); staff members
 *   cannot, so they wait until their laboratory has an active subscription
 * @returns `/iam/change-password`, `/subscriptions/plans`, {@link SUBSCRIPTION_PAUSED}, `/laboratories/create` or
 *   `/dashboard` when the onboarding is completed
 */
export function onboardingDestination(state: OnboardingState, managesSubscription = true): string {
  if (state.nextStep === 'PASSWORD_CHANGE') return '/iam/change-password';
  if (state.subscriptionStatus !== 'ACTIVE') return managesSubscription ? '/subscriptions/plans' : SUBSCRIPTION_PAUSED;
  return state.laboratoryId === null ? '/laboratories/create' : '/dashboard';
}
