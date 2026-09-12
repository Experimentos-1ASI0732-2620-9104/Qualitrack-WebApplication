export interface OnboardingState {
  userId: number;
  laboratoryId: number | null;
  subscriptionId: number | null;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE';
  nextStep: 'SUBSCRIPTION' | 'LABORATORY' | 'READY';
}

export function onboardingDestination(state: OnboardingState): string {
  if (state.subscriptionStatus !== 'ACTIVE') return '/subscriptions/plans';
  return state.laboratoryId === null ? '/laboratories/create' : '/dashboard';
}
