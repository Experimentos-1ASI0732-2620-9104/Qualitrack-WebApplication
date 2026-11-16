/**
 * Subscription plan whose name, price and equipment limit the operational overview shows.
 */
export class OverviewPlan {
  code: string;

  name: string;

  /** `MONTHLY` or `YEARLY`. */
  billingPeriod: string;

  priceAmount: number;

  currency: string;

  /** Equipment the plan allows; null when it is unlimited. */
  maxEquipment: number | null;

  constructor(params: {
    code: string;
    name: string;
    billingPeriod: string;
    priceAmount: number;
    currency: string;
    maxEquipment: number | null;
  }) {
    this.code = params.code;
    this.name = params.name;
    this.billingPeriod = params.billingPeriod;
    this.priceAmount = params.priceAmount;
    this.currency = params.currency;
    this.maxEquipment = params.maxEquipment;
  }
}
