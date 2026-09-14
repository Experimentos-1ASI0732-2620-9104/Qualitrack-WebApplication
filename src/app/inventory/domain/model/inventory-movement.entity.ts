import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { InventoryUnit } from './raw-material.entity';
export type InventoryMovementType = 'RECEIPT' | 'REVIEW' | 'CONSUMPTION' | 'OPENING_BALANCE';

/** Domain state, independent from HTTP resources. Stock values are supplied by the server. */
export class InventoryMovement implements BaseEntity {
  readonly id: number;
  readonly materialId: number;
  readonly receiptId: number;
  readonly productBatchId: number | null;
  readonly type: InventoryMovementType;
  readonly amount: number;
  readonly unit: InventoryUnit;
  readonly stockBefore: number;
  readonly stockAfter: number;
  readonly statusBefore: string | null;
  readonly statusAfter: string;
  readonly reason: string;
  readonly actorId: number;
  readonly occurredAt: string;
  constructor(params: {
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
  }) {
    this.id = params.id;
    this.materialId = params.materialId;
    this.receiptId = params.receiptId;
    this.productBatchId = params.productBatchId;
    this.type = params.type;
    this.amount = params.amount;
    this.unit = params.unit;
    this.stockBefore = params.stockBefore;
    this.stockAfter = params.stockAfter;
    this.statusBefore = params.statusBefore;
    this.statusAfter = params.statusAfter;
    this.reason = params.reason;
    this.actorId = params.actorId;
    this.occurredAt = params.occurredAt;
  }
}
