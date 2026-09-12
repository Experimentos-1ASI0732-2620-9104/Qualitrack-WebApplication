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
import { UpdateSubscriptionStatusRequest } from './update-subscription-status.request';

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
      .get<SubscriptionResource | SubscriptionResource[]>(
        `${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratorySubscriptionsEndpointPath}`,
        { params }
      )
      .pipe(
        map((response) => {
          const resource = Array.isArray(response)
            ? response.find((subscription) => subscription.status === 'ACTIVE')
            : response;

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

  cancelSubscription(
    subscriptionId: number,
    request: UpdateSubscriptionStatusRequest,
  ): Observable<number> {
    return this.http
      .patch<number>(`${subscriptionsEndpointUrl}/${subscriptionId}`, request)
      .pipe(catchError(this.handleError(`Failed to cancel subscription ${subscriptionId}`)));
  }
}
