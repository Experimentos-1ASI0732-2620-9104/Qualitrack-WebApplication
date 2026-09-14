import { InventoryUnit } from './raw-material.entity';

/** Keep operationId unchanged when retrying the same consumption request. */
export interface ConsumeRawMaterialBatchCommand {
  readonly laboratoryId: number;
  readonly rawMaterialBatchId: number;
  readonly productBatchId: number;
  readonly amountUsed: number;
  readonly unit: InventoryUnit;
  readonly operationId: string;
}
