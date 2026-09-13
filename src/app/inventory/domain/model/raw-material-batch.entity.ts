import { InventoryUnit } from './raw-material.entity';

export type RawMaterialBatchStatus = 'QUARANTINED' | 'RELEASED' | 'OBSERVED' | 'REJECTED';

/** One supplier receipt. Dates are ISO calendar dates, not browser-local timestamps. */
export interface RawMaterialBatch {
  readonly id: number;
  readonly laboratoryId: number;
  readonly rawMaterialId: number;
  readonly supplier: string;
  readonly batchNumber: string;
  readonly unit: InventoryUnit;
  readonly initialAmount: number;
  readonly availableAmount: number;
  readonly receivedOn: string;
  readonly expiresOn: string;
  readonly status: RawMaterialBatchStatus;
}
