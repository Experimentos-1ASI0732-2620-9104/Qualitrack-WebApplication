import { Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SubscriptionStore } from '../../../application/subscription.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../domain/model/subscription-plan.entity';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { computed, signal } from '@angular/core';

/**
 * Component responsible for displaying available subscription plans.
 *
 * @remarks
 * This standalone presentation component allows users to inspect subscription
 * plans and start a checkout flow. If the user is not authenticated, the
 * selected plan is stored and the user is redirected to sign-up. While the
 * account already pays for a plan, no plan can be bought: the view marks the
 * plan the laboratory pays for and sends the other ones to Billing.
 */
@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [
    CommonModule,
    DateOnlyPipe,
    RouterLink,
    TranslatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './plan-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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

  /** Billing periods supported by the toggle. */
  readonly billingPeriod = signal<'MONTHLY' | 'YEARLY'>('MONTHLY');

  /**
   * Currently selected billing period.
   */
  readonly visiblePlans = computed(() =>
    this.store.plans().filter((p) => p.billingPeriod?.toUpperCase() === this.billingPeriod()),
  );

  /** Whether the account already pays for a plan: the platform sells no other until that one ends. */
  protected readonly subscribed = computed(
    () => this.iamStore.onboarding()?.subscriptionStatus === 'ACTIVE',
  );

  /** Whether the account has a laboratory, which Billing needs. */
  protected readonly hasLaboratory = computed(() => this.iamStore.currentLaboratoryId() !== null);

  /**
   * The active subscription of the current laboratory, or null while it is unknown. One read for another account or
   * laboratory is ignored.
   */
  protected readonly currentSubscription = computed(() => {
    const subscription = this.store.currentSubscription();
    const laboratoryId = this.iamStore.currentLaboratoryId();
    return this.subscribed() &&
      laboratoryId !== null &&
      subscription?.status === 'ACTIVE' &&
      subscription.laboratoryId === laboratoryId
      ? subscription
      : null;
  });

  /** Set once the person picks a period, so the period of the paid plan no longer replaces it. */
  private periodChosen = false;

  constructor() {
    // A plan chosen on the website goes straight to its checkout, unless the account already pays for one.
    effect(() => {
      const plan = this.store.selectedPlan();
      if (plan && this.iamStore.onboarding()?.subscriptionStatus === 'INACTIVE') this.openCheckout(plan);
    });
    // The view opens on the period of the paid plan, so its mark is in sight.
    effect(() => {
      const current = this.currentSubscription();
      if (current && !this.periodChosen) this.billingPeriod.set(current.billingCycle);
    });
  }

  /**
   * Lifecycle hook that loads available subscription plans and, while the account pays for one, the plan of its
   * laboratory.
   */
  ngOnInit(): void {
    this.store.loadPlans();
    const laboratoryId = this.iamStore.currentLaboratoryId();
    if (this.subscribed() && laboratoryId !== null) this.store.loadCurrentPlan(laboratoryId);
  }

  /**
   * Shows the plans of a billing period.
   *
   * @param period - Billing period the person picked
   */
  protected choosePeriod(period: 'MONTHLY' | 'YEARLY'): void {
    this.periodChosen = true;
    this.billingPeriod.set(period);
  }

  /**
   * Whether the laboratory pays for this plan, with this billing period.
   *
   * @param plan - Subscription plan of a card
   * @returns True for the plan of the active subscription
   */
  protected isCurrent(plan: SubscriptionPlan): boolean {
    const current = this.currentSubscription();
    return current?.planCode === plan.code && current.billingCycle === plan.billingPeriod;
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

    this.openCheckout(plan);
  }

  private openCheckout(plan: SubscriptionPlan): void {
    void this.router.navigate(['/subscriptions/checkout'], {
      queryParams: { plan: plan.code, billingCycle: plan.billingPeriod },
    });
  }

  protected signOut(): void {
    this.iamStore.signOut(this.router);
  }

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
