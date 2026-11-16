import { Routes } from '@angular/router';
import { onboardingGuard, subscriptionGuard } from '../../iam/infrastructure/onboarding-guard';

/**
 * Lazy loads the subscription plan list view.
 *
 * @returns A Promise that resolves to the PlanList component
 */
const planList = () => import('./views/plan-list/plan-list').then((m) => m.PlanList);

/**
 * Lazy loads the checkout view.
 *
 * @returns A Promise that resolves to the Checkout component
 */
const checkout = () => import('./views/checkout/checkout').then((m) => m.Checkout);

/**
 * Lazy loads the payment success view.
 *
 * @returns A Promise that resolves to the PaymentSuccess component
 */
const paymentSuccess = () =>
  import('./views/payment-success/payment-success').then((m) => m.PaymentSuccess);

/**
 * Lazy loads the payment cancel view.
 *
 * @returns A Promise that resolves to the PaymentCancel component
 */
const paymentCancel = () =>
  import('./views/payment-cancel/payment-cancel').then((m) => m.PaymentCancel);

/**
 * Lazy loads the billing summary view.
 *
 * @returns A Promise that resolves to the BillingSummary component
 */
const billingSummary = () =>
  import('./views/billing-summary/billing-summary').then((m) => m.BillingSummary);

/**
 * Routing configuration for the Subscription bounded context.
 *
 * @remarks
 * Groups subscription and payment-related views. The plan list and checkout flow are used to start a
 * subscription, while success, cancel, and billing (`billing`) views support the payment lifecycle.
 */
export const subscriptionRoutes: Routes = [
  { path: 'plans', loadComponent: planList, canActivate: [subscriptionGuard], title: 'page-titles.plans' },
  { path: 'checkout', loadComponent: checkout, canActivate: [subscriptionGuard], title: 'page-titles.checkout' },
  { path: 'success', loadComponent: paymentSuccess, canActivate: [subscriptionGuard], title: 'page-titles.payment-success' },
  { path: 'cancel', loadComponent: paymentCancel, canActivate: [subscriptionGuard], title: 'page-titles.payment-cancel' },
  { path: 'billing', loadComponent: billingSummary, canActivate: [onboardingGuard], title: 'page-titles.billing' },
  // View-named path used before semantic routes.
  { path: 'billing-summary', redirectTo: 'billing', pathMatch: 'full' },
  { path: '', redirectTo: 'plans', pathMatch: 'full' },
];
