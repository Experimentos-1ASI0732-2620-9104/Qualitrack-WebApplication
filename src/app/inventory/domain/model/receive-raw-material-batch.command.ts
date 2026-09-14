import { InventoryUnit } from './raw-material.entity';
export interface ReceiveRawMaterialBatchCommand {
  supplier: string;
  batchNumber: string;
  unit: InventoryUnit;
  amount: number;
  receivedOn: string;
  expiresOn: string;
}
