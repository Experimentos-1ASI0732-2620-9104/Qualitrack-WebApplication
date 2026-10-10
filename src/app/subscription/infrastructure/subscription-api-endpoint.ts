import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { Payment } from '../domain/model/payment.entity';

import { SubscriptionPlanResource } from './subscription-plan-response';
import { SubscriptionResource } from './subscription-response';
import { PaymentResource } from './payment-response';
import { CreateCheckoutSessionRequest } from './checkout.request';
import { CheckoutSessionResource, CheckoutSessionResponse } from './checkout-response';

import { SubscriptionPlanAssembler } from './subscription-plan-assembler';
import { SubscriptionAssembler } from './subscription-assembler';
import { PaymentAssembler } from './payment-assembler';
import { CheckoutSessionAssembler } from './checkout-session-assembler';

const plansEndpointUrl = `${environment.serverBasePath}${environment.subscriptionPlansEndpointPath}`;
const subscriptionsEndpointUrl = `${environment.serverBasePath}${environment.subscriptionsEndpointPath}`;
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;
const checkoutSessionsEndpointUrl = `${environment.serverBasePath}${environment.subscriptionCheckoutSessionsEndpointPath}`;

/**
 * HTTP endpoint client for subscription and payment operations.
 */
export class SubscriptionApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly planAssembler = new SubscriptionPlanAssembler();
  private readonly subscriptionAssembler = new SubscriptionAssembler();
  private readonly paymentAssembler = new PaymentAssembler();
  private readonly checkoutAssembler = new CheckoutSessionAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlanResource[]>(plansEndpointUrl).pipe(
      map((resources) => this.planAssembler.toEntitiesFromResources(resources)),
      catchError(this.handleError('Failed to fetch subscription plans')),
    );
  }

  getCurrentSubscription(laboratoryId: number): Observable<Subscription> {
    const params = new HttpParams().set('status', 'ACTIVE');

    return this.http
      .get<SubscriptionResource[]>(
        `${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratorySubscriptionsEndpointPath}`,
        { params }
      )
      .pipe(
        map((response) => {
          const resource = response.find((subscription) => subscription.status === 'ACTIVE');

          if (!resource) {
            throw new HttpErrorResponse({ status: 404, statusText: 'No active subscription' });
          }

          return this.subscriptionAssembler.toEntityFromResource(resource);
        }),
        catchError(this.handleError(`Failed to fetch subscription for laboratory ${laboratoryId}`)),
      );
  }

  getPaymentsBySubscription(subscriptionId: number): Observable<Payment[]> {
    return this.http
      .get<PaymentResource[]>(`${subscriptionsEndpointUrl}/${subscriptionId}/payments`)
      .pipe(
        map((resources) => this.paymentAssembler.toEntitiesFromResources(resources)),
        catchError(this.handleError(`Failed to fetch payments for subscription ${subscriptionId}`)),
      );
  }

  createCheckoutSession(
    request: CreateCheckoutSessionRequest,
  ): Observable<CheckoutSessionResource> {
    return this.http.post<CheckoutSessionResponse>(checkoutSessionsEndpointUrl, request).pipe(
      map((response) => this.checkoutAssembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to create checkout session')),
    );
  }

  /**
   * Cancels the renewal of the subscription for the authenticated quality manager (US23, TS11); it keeps its access
   * until the end of the paid period.
   */
  cancelRenewal(subscriptionId: number): Observable<Subscription> {
    return this.http
      .post<SubscriptionResource>(
        `${subscriptionsEndpointUrl}/${subscriptionId}${environment.subscriptionCancellationRequestsEndpointPath}`, null)
      .pipe(
        map((resource) => this.subscriptionAssembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to cancel the renewal of subscription ${subscriptionId}`)),
      );
  }
}
