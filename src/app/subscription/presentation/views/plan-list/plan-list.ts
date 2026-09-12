import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SubscriptionStore } from '../../../application/subscription.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { Toolbar } from '../../../../shared/presentation/components/toolbar/toolbar';
import { SubscriptionPlan } from '../../../domain/model/subscription-plan.entity';

/**
 * Component responsible for displaying available subscription plans.
 *
 * @remarks
 * This standalone presentation component allows users to inspect subscription
 * plans and start a checkout flow. If the user is not authenticated, the
 * selected plan is stored and the user is redirected to sign-up.
 */
@Component({
  selector: 'app-plan-list',
  standalone: true,
  providers: [SubscriptionStore],
  imports: [
    CommonModule,
    Toolbar,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './plan-list.html',
  styleUrl: './plan-list.css',
})
export class PlanList implements OnInit {
  /**
   * Store responsible for subscription plan state and checkout selection.
   */
  protected readonly store = inject(SubscriptionStore);

  /**
   * Store responsible for authentication state.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Router used to navigate to authentication or checkout views.
   */
  private readonly router = inject(Router);

  /**
   * Lifecycle hook that loads available subscription plans.
   */
  ngOnInit(): void {
    this.store.loadPlans();
  }

  /**
   * Handles plan selection.
   *
   * @param plan - Selected subscription plan
   */
  protected onSelectPlan(plan: SubscriptionPlan): void {
    this.store.selectPlan({
      planCode: plan.code,
      billingCycle: plan.billingPeriod,
    });

    if (!this.iamStore.isSignedIn()) {
      this.router
        .navigate(['/iam/sign-up'], {
          queryParams: {
            plan: plan.code,
            billingCycle: plan.billingPeriod,
          },
        })
        .then();
      return;
    }

    this.router
      .navigate(['/subscriptions/checkout'], {
        queryParams: {
          plan: plan.code,
          billingCycle: plan.billingPeriod,
        },
      })
      .then();
  }

  protected signOut(): void { this.iamStore.signOut(this.router); }

  /**
   * Formats a plan price for display.
   *
   * @param plan - Subscription plan to format
   * @returns Human-readable price string
   */
  protected formatPrice(plan: SubscriptionPlan): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: plan.currency,
    }).format(plan.priceAmount);
  }
}
