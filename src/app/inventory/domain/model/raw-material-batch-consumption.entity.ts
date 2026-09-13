import { InventoryUnit } from './raw-material.entity';

/** Authoritative stock change returned after the server commits the transaction. */
export interface RawMaterialBatchConsumption {
  readonly rawMaterialBatchId: number;
  readonly productBatchId: number;
  readonly amountUsed: number;
  readonly unit: InventoryUnit;
  readonly stockBefore: number;
  readonly stockAfter: number;
  readonly operationId: string;
}
