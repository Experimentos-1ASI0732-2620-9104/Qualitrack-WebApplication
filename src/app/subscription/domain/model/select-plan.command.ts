/**
 * Command for selecting a subscription plan before checkout.
 *
 * @remarks
 * This command captures the user's intent to start a subscription flow with a
 * specific plan and billing cycle. It can be stored temporarily while the user
 * signs in or signs up.
 */
export interface SelectPlanCommand {
  /**
   * The business code of the selected subscription plan.
   */
  planCode: string;

  /**
   * The selected billing cycle.
   */
  billingCycle: 'MONTHLY' | 'YEARLY';
}
