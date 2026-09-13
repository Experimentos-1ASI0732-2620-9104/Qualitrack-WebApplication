import { InventoryUnit } from './raw-material.entity';

/** Eligible receipt projection supplied by the backend; the browser does not decide eligibility. */
export interface AvailableReceipt {
  readonly id: number;
  readonly rawMaterialId: number;
  readonly batchNumber: string;
  readonly unit: InventoryUnit;
  readonly availableAmount: number;
  readonly expiresOn: string;
}
