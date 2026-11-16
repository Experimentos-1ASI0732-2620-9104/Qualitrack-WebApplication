import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionStore } from '../../../application/subscription.store';
import { PlanSwitch } from '../../../domain/model/plan-switch';
import { PlanSwitchDialog } from '../plan-switch-dialog/plan-switch-dialog';

/**
 * Tells someone who arrives with a plan chosen on the website, and already pays for another one, how to switch.
 *
 * @remarks
 * It shows nothing by itself and opens {@link PlanSwitchDialog} when there is something to say. The root routes hand it
 * to the dashboard, which lives in another bounded context and does not import this one.
 */
@Component({
  selector: 'app-plan-switch-notice',
  standalone: true,
  template: '',
  styles: ':host { display: none; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanSwitchNotice implements OnInit {
  private readonly store = inject(SubscriptionStore);
  private readonly iam = inject(IamStore);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  async ngOnInit(): Promise<void> {
    const laboratoryId = this.iam.currentLaboratoryId();
    if (!laboratoryId || !this.iam.canManageQuality()) return;

    const planSwitch = await this.store.findPlanSwitch(laboratoryId);
    // Whoever left the page in the meantime no longer expects the notice.
    if (!planSwitch || this.destroyRef.destroyed) return;

    const { chosen, current } = planSwitch;
    this.dialog.open(PlanSwitchDialog, {
      data: {
        chosen: this.label(planSwitch, chosen.planCode, chosen.billingCycle),
        current: this.label(planSwitch, current.planCode, current.billingCycle),
        periodEnd: current.currentPeriodEnd,
      },
    });
  }

  /** Name of a plan in the catalog, or its code, with its billing period. */
  private label({ plans }: PlanSwitch, planCode: string, billingCycle: string): string {
    const plan = plans.find((item) => item.code === planCode && item.billingPeriod === billingCycle);
    return `${plan?.name ?? planCode} (${this.translate.instant('subscription.billing-period.' + billingCycle.toLowerCase())})`;
  }
}
