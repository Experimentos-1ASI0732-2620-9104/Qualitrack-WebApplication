import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SubscriptionStore } from '../../../application/subscription.store';
import { IamStore } from '../../../../iam/application/iam.store';

type BillingCycle = 'MONTHLY' | 'YEARLY';

/**
 * Component responsible for starting a subscription checkout session.
 *
 * @remarks
 * This standalone presentation component receives a selected plan from the
 * route query parameters or the SubscriptionStore. It allows authenticated
 * users to create a checkout session and be redirected to the external payment
 * provider.
 */
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  /**
   * Route used to read the selected plan code from query parameters.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Store responsible for subscription and checkout state.
   */
  protected readonly store = inject(SubscriptionStore);

  /**
   * Store responsible for authentication state.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Selected plan code used by the checkout flow.
   */
  protected planCode: string | null = null;

  /**
   * Selected billing cycle used by the checkout flow.
   */
  protected billingCycle: BillingCycle | null = null;

  /**
   * Lifecycle hook that resolves the selected plan and loads plans if needed.
   */
  ngOnInit(): void {
    this.planCode = this.route.snapshot.queryParamMap.get('plan') || this.store.selectedPlanCode();

    this.billingCycle =
      this.toBillingCycle(this.route.snapshot.queryParamMap.get('billingCycle')) ||
      this.store.selectedBillingCycle();

    if (this.planCode && this.billingCycle) {
      this.store.selectPlan({
        planCode: this.planCode,
        billingCycle: this.billingCycle,
      });
    }

    this.store.loadPlans();
  }

  /**
   * Creates the checkout session for the selected plan.
   */
  protected onCheckout(): void {
    const userId = this.iamStore.currentUserId();
    const laboratoryId = this.iamStore.currentLaboratoryId();
    const selectedPlanCode = this.planCode || this.store.selectedPlanCode();
    const selectedBillingCycle = this.billingCycle || this.store.selectedBillingCycle();

    if (!userId || !selectedPlanCode || !selectedBillingCycle || this.store.isLoading()) return;

    this.store.createCheckoutSession({
      planCode: selectedPlanCode,
      billingCycle: selectedBillingCycle,
      userId,
      laboratoryId,
      successUrl: `${window.location.origin}/subscriptions/success`,
      cancelUrl: `${window.location.origin}/subscriptions/cancel`,
    });
  }

  /**
   * Converts a query parameter into a valid billing cycle.
   *
   * @param value - Raw query parameter value
   * @returns Billing cycle value or null
   */
  private toBillingCycle(value: string | null): BillingCycle | null {
    return value === 'MONTHLY' || value === 'YEARLY' ? value : null;
  }
}
