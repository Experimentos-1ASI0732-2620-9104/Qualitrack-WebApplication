import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { Payment } from '../domain/model/payment.entity';

import { SubscriptionApiEndpoint } from './subscription-api-endpoint';
import { CreateCheckoutSessionRequest } from './checkout.request';
import { CheckoutSessionResource } from './checkout-response';
import { UpdateSubscriptionStatusRequest } from './update-subscription-status.request';

/**
 * HTTP API facade for the Subscription bounded context.
 *
 * @remarks
 * This service belongs to the infrastructure layer and exposes subscription
 * and payment-related API operations to the application store.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionApi extends BaseApi {
  /**
   * Endpoint client responsible for subscription and payment HTTP operations.
   */
  private readonly endpoint: SubscriptionApiEndpoint;

  /**
   * Creates a new SubscriptionApi facade.
   *
   * @param http - Angular HttpClient used by the endpoint client
   */
  constructor(http: HttpClient) {
    super();
    this.endpoint = new SubscriptionApiEndpoint(http);
  }

  /**
   * Retrieves all available subscription plans.
   *
   * @returns Observable stream emitting subscription plan entities
   */
  getPlans(): Observable<SubscriptionPlan[]> {
    return this.endpoint.getPlans();
  }

  /**
   * Retrieves the active subscription for a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting the active Subscription entity
   */
  getCurrentSubscription(laboratoryId: number): Observable<Subscription> {
    return this.endpoint.getCurrentSubscription(laboratoryId);
  }

  /**
   * Retrieves payment history for a subscription.
   *
   * @param subscriptionId - Numeric identifier of the subscription
   * @returns Observable stream emitting payment entities
   */
  getPaymentsBySubscription(subscriptionId: number): Observable<Payment[]> {
    return this.endpoint.getPaymentsBySubscription(subscriptionId);
  }

  /**
   * Creates a checkout session for a selected plan.
   *
   * @param request - Request payload containing checkout data
   * @returns Observable stream emitting the checkout session resource
   */
  createCheckoutSession(
    request: CreateCheckoutSessionRequest,
  ): Observable<CheckoutSessionResource> {
    return this.endpoint.createCheckoutSession(request);
  }

  cancelSubscription(
    subscriptionId: number,
    request: UpdateSubscriptionStatusRequest,
  ): Observable<number> {
    return this.endpoint.cancelSubscription(subscriptionId, request);
  }
}
