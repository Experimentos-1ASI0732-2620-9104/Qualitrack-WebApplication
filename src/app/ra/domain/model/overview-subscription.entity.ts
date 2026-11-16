/**
 * Subscription of the laboratory that the operational overview shows to the quality manager.
 *
 * @remarks
 * Payments & Subscriptions keeps the subscription; Reporting & Audit only shows its plan, status and period.
 */
export class OverviewSubscription {
  laboratoryId: number;

  planCode: string;

  /** `MONTHLY` or `YEARLY`. */
  billingCycle: string;

  /** `PENDING`, `ACTIVE`, `PAST_DUE`, `CANCELED` or `EXPIRED`. */
  status: string;

  currentPeriodEnd: string | null;

  constructor(params: {
    laboratoryId: number;
    planCode: string;
    billingCycle: string;
    status: string;
    currentPeriodEnd: string | null;
  }) {
    this.laboratoryId = params.laboratoryId;
    this.planCode = params.planCode;
    this.billingCycle = params.billingCycle;
    this.status = params.status;
    this.currentPeriodEnd = params.currentPeriodEnd;
  }
}
