import { SelectPlanCommand } from './select-plan.command';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Subscription } from './subscription.entity';

/**
 * A plan chosen on the website that differs from the one the laboratory already pays for.
 *
 * @remarks
 * The platform has no direct plan switch: the current subscription has to end before another plan can be bought.
 */
export interface PlanSwitch {
  /** Plan and billing cycle chosen on the website. */
  chosen: SelectPlanCommand;

  /** Active subscription of the laboratory. */
  current: Subscription;

  /** Catalog that names the plans; empty when it could not be read. */
  plans: SubscriptionPlan[];
}
