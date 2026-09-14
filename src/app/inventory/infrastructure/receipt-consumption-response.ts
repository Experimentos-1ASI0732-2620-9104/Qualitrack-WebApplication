import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit } from '../domain/model/raw-material.entity';
export interface AvailableReceiptResource extends BaseResource {
  id: number;
  rawMaterialId: number;
  batchNumber: string;
  unit: InventoryUnit;
  availableAmount: number;
  expiresOn: string;
}
export interface ReceiptConsumptionResponse extends BaseResponse {
  rawMaterialBatchId: number;
  productBatchId: number;
  amountUsed: number;
  unit: InventoryUnit;
  stockBefore: number;
  stockAfter: number;
  operationId: string;
}
