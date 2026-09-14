import { InventoryUnit } from '../domain/model/raw-material.entity';

/** Command result without an independent entity identity; stock is authoritative from the server. */
export interface RawMaterialBatchConsumption {
  readonly rawMaterialBatchId: number;
  readonly productBatchId: number;
  readonly amountUsed: number;
  readonly unit: InventoryUnit;
  readonly stockBefore: number;
  readonly stockAfter: number;
  readonly operationId: string;
}
