import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { errorStatus } from '../../shared/infrastructure/api-error';

import { SubscriptionApi } from '../infrastructure/subscription-api';
import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { Payment } from '../domain/model/payment.entity';
import { PlanSwitch } from '../domain/model/plan-switch';
import { SelectPlanCommand } from '../domain/model/select-plan.command';
import { CreateCheckoutSessionCommand } from '../domain/model/create-checkout-session.command';
import { CreateCheckoutSessionRequest } from '../infrastructure/checkout.request';
import { CheckoutSessionResource } from '../infrastructure/checkout-response';

/**
 * Signal-based application store for the Subscription bounded context.
 *
 * @remarks
 * This store belongs to the application layer. It receives commands from the
 * presentation layer, maps them into infrastructure request DTOs, delegates API
 * operations to {@link SubscriptionApi}, and exposes reactive subscription,
 * plan, payment, and checkout state to the UI.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionStore {
  /**
   * Infrastructure facade used to communicate with subscription APIs.
   */
  private readonly api = inject(SubscriptionApi);
  private readonly iam = inject(IamStore);
  private readonly router = inject(Router);

  /**
   * Internal list of available subscription plans.
   */
  private readonly _plans = signal<SubscriptionPlan[]>([]);

  /**
   * Internal current subscription state.
   */
  private readonly _currentSubscription = signal<Subscription | null>(null);

  /**
   * Internal payment history state.
   */
  private readonly _payments = signal<Payment[]>([]);

  /**
   * Internal selected plan code state.
   */
  private readonly _selectedPlanCode = signal<string | null>(
    sessionStorage.getItem('selectedPlanCode'),
  );

  /**
   * Internal selected billing cycle state.
   */
  private readonly _selectedBillingCycle = signal<'MONTHLY' | 'YEARLY' | null>(
    (sessionStorage.getItem('selectedBillingCycle') as 'MONTHLY' | 'YEARLY' | null) ?? null,
  );

  /**
   * Internal checkout session state.
   */
  private readonly _checkoutSession = signal<CheckoutSessionResource | null>(null);

  /**
   * Internal loading state.
   */
  private readonly _isLoading = signal<boolean>(false);

  /**
   * Internal error message state.
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Internal success message state.
   */
  private readonly _successMsg = signal<string | null>(null);

  /**
   * Readonly signal containing available subscription plans.
   */
  readonly plans = this._plans.asReadonly();

  /**
   * Readonly signal containing the current subscription.
   */
  readonly currentSubscription = this._currentSubscription.asReadonly();

  /**
   * Readonly signal containing payment history.
   */
  readonly payments = this._payments.asReadonly();

  /**
   * Readonly signal containing the selected plan code.
   */
  readonly selectedPlanCode = this._selectedPlanCode.asReadonly();

  /**
   * Readonly signal containing the selected billing cycle.
   */
  readonly selectedBillingCycle = this._selectedBillingCycle.asReadonly();

  /**
   * Readonly signal containing the checkout session.
   */
  readonly checkoutSession = this._checkoutSession.asReadonly();

  /**
   * Readonly signal indicating whether the store is loading.
   */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Readonly signal containing the current error message.
   */
  readonly error = this._error.asReadonly();

  /**
   * Readonly signal containing the current success message.
   */
  readonly successMsg = this._successMsg.asReadonly();

  /**
   * Computed selected plan entity based on selected plan code and billing cycle.
   */
  readonly selectedPlan = computed(() => {
    const planCode = this._selectedPlanCode();
    const billingCycle = this._selectedBillingCycle();

    return planCode && billingCycle
      ? (this._plans().find(
          (plan) => plan.code === planCode && plan.billingPeriod === billingCycle,
        ) ?? null)
      : null;
  });

  /**
   * Computed active subscription flag.
   */
  readonly hasActiveSubscription = computed(() => this._currentSubscription()?.status === 'ACTIVE');

  constructor() {
    // The plan lives in sessionStorage, which a reload keeps: the next person on this tab must not inherit it.
    this.iam.beforeSignOut(() => this.clearSelectedPlan());
  }

  /**
   * Loads all available subscription plans.
   */
  loadPlans(): void {
    this.startRequest();

    this.api.getPlans().subscribe({
      next: (plans) => {
        this._plans.set(plans.filter((plan) => plan.active));
        this.finishRequest();
      },
      error: (error) => this.failRequest(error, 'Failed to load subscription plans'),
    });
  }

  /**
   * Loads the current active subscription for a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   */
  loadCurrentSubscription(laboratoryId: number): void {
    this.startRequest();

    this.api.getCurrentSubscription(laboratoryId).subscribe({
      next: (subscription) => {
        this._currentSubscription.set(subscription);
        this.finishRequest();

        this.loadPayments(subscription.id);
      },
      error: (error) => {
        if (this.isNotFoundError(error)) {
          this._currentSubscription.set(null);
          this._payments.set([]);
          this.finishRequest();
          return;
        }

        this.failRequest(error, 'Failed to load current subscription');
      },
    });
  }

  /**
   * Reads the active subscription of a laboratory so the plans view can mark the plan it pays for. Unlike
   * {@link loadCurrentSubscription} it leaves the loading and error state of the plans alone and reads no payments:
   * when the subscription cannot be read, the plans are shown without the mark.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   */
  loadCurrentPlan(laboratoryId: number): void {
    this.api.getCurrentSubscription(laboratoryId).subscribe({
      next: (subscription) => this._currentSubscription.set(subscription),
      error: () => this._currentSubscription.set(null),
    });
  }

  /**
   * Loads payment history for a subscription.
   *
   * @param subscriptionId - Numeric identifier of the subscription
   */
  loadPayments(subscriptionId: number): void {
    this.startRequest();

    this.api.getPaymentsBySubscription(subscriptionId).subscribe({
      next: (payments) => {
        this._payments.set(payments);
        this.finishRequest();
      },
      error: (error) => this.failRequest(error, 'Failed to load payment history'),
    });
  }

  /**
   * Selects a subscription plan before authentication or checkout.
   *
   * @param command - Command containing the selected plan code and billing cycle
   */
  selectPlan(command: SelectPlanCommand): void {
    this._selectedPlanCode.set(command.planCode);
    this._selectedBillingCycle.set(command.billingCycle);

    sessionStorage.setItem('selectedPlanCode', command.planCode);
    sessionStorage.setItem('selectedBillingCycle', command.billingCycle);
  }

  /**
   * Clears the selected subscription plan.
   */
  clearSelectedPlan(): void {
    this._selectedPlanCode.set(null);
    this._selectedBillingCycle.set(null);

    sessionStorage.removeItem('selectedPlanCode');
    sessionStorage.removeItem('selectedBillingCycle');
  }

  /**
   * Compares the plan chosen on the website with the active subscription of the laboratory. That plan cannot be bought
   * while another is paid, so an active subscription spends the choice; without one it stays for the plans view.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns The switch to tell about, or null when no plan was chosen, it is the plan already paid for, or there is no
   * active subscription that could be read
   */
  async findPlanSwitch(laboratoryId: number): Promise<PlanSwitch | null> {
    const planCode = this._selectedPlanCode();
    const billingCycle = this._selectedBillingCycle();
    if (!planCode || !billingCycle) return null;

    try {
      const [current, plans] = await Promise.all([
        firstValueFrom(this.api.getCurrentSubscription(laboratoryId)),
        // The catalog only names the plans: without it the notice uses their codes.
        firstValueFrom(this.api.getPlans()).catch((): SubscriptionPlan[] => []),
      ]);
      this.clearSelectedPlan();
      if (current.planCode === planCode && current.billingCycle === billingCycle) return null;
      return { chosen: { planCode, billingCycle }, current, plans };
    } catch {
      return null;
    }
  }

  /**
   * Creates a checkout session for a selected plan.
   *
   * @param command - Command containing selected plan and user context
   */
  createCheckoutSession(command: CreateCheckoutSessionCommand): void {
    this.startRequest();

    const request = this.toCreateCheckoutSessionRequest(command);

    this.api.createCheckoutSession(request).subscribe({
      next: (session) => {
        this._checkoutSession.set(session);
        this._successMsg.set('Checkout session created successfully');
        this.finishRequest();
        // The choice is spent: coming back from Stripe must not send the person to checkout again.
        this.clearSelectedPlan();

        if (session.checkoutUrl) {
          window.location.href = session.checkoutUrl;
        }
      },
      error: (error) => {
        if (errorStatus(error) === 409) {
          this._error.set('subscription.plans.already-active');
          this._isLoading.set(false);
        } else this.failRequest(error, 'Failed to create checkout session');
      },
    });
  }

  /**
   * Cancels the renewal of the subscription (US23): it keeps its access until the end of the paid period and is not
   * charged again. The platform records the authenticated user as the one who cancelled it.
   */
  cancelRenewal(subscriptionId: number): void {
    this.startRequest();

    this.api.cancelRenewal(subscriptionId).subscribe({
      next: (subscription) => {
        this._currentSubscription.set(subscription);
        this.iam.invalidateOnboarding();
        this.finishRequest();
        this._successMsg.set('subscription.billing.renewal-cancelled-notice');
      },
      error: () => {
        this._error.set('subscription.billing.errors.cancel-renewal');
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Clears feedback messages.
   */
  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Maps a CreateCheckoutSessionCommand into the request payload expected by the API.
   *
   * @param command - Application command to map
   * @returns Infrastructure request DTO
   */
  private toCreateCheckoutSessionRequest(
    command: CreateCheckoutSessionCommand,
  ): CreateCheckoutSessionRequest {
    return {
      userId: command.userId,
      laboratoryId: command.laboratoryId,
      planCode: command.planCode,
      billingCycle: command.billingCycle,
      successUrl: command.successUrl,
      cancelUrl: command.cancelUrl,
    };
  }

  /**
   * Sets loading state and clears previous feedback messages.
   */
  private startRequest(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Clears loading state after a successful request.
   */
  private finishRequest(): void {
    this._isLoading.set(false);
  }

  /**
   * Stores a normalized error message and clears loading state.
   *
   * @param error - Raw error object
   * @param fallback - Fallback message used when the error cannot be parsed
   */
  private failRequest(error: unknown, fallback: string): void {
    this._error.set(this.formatError(error, fallback));
    this._isLoading.set(false);
  }

  /**
   * Determines whether the received error represents a missing resource.
   *
   * @param error - Raw error object
   * @returns True when the error is a not-found response
   */
  private isNotFoundError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('Resource not found');
  }

  /**
   * Normalizes runtime and infrastructure errors into UI-friendly messages.
   *
   * @param error - Raw error object
   * @param fallback - Fallback message used when parsing fails
   * @returns Human-readable error message
   */
  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  }
}
