import { InventoryUnit } from './raw-material.entity';
import { BaseEntity } from '../../../shared/domain/model/base-entity';

/** Eligible receipt projection supplied by the backend; the browser does not decide eligibility. */
export interface AvailableReceipt extends BaseEntity {
  readonly id: number;
  readonly rawMaterialId: number;
  readonly batchNumber: string;
  readonly unit: InventoryUnit;
  readonly availableAmount: number;
  readonly expiresOn: string;
}
