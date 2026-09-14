import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit } from '../domain/model/raw-material.entity';
import { InventoryMovementType } from '../domain/model/inventory-movement.entity';

export interface InventoryMovementResource extends BaseResource {
  id: number;
  materialId: number;
  receiptId: number;
  productBatchId: number | null;
  type: InventoryMovementType;
  amount: number;
  unit: InventoryUnit;
  stockBefore: number;
  stockAfter: number;
  statusBefore: string | null;
  statusAfter: string;
  reason: string;
  actorId: number;
  occurredAt: string;
}
export interface InventoryMovementsResponse extends BaseResponse {
  movements: InventoryMovementResource[];
}
