import { BaseEntity } from '../../../shared/domain/model/base-entity';

/** Read-only consumption of a material by a production batch, as Inventory needs it for quality and history. */
export class MaterialConsumption implements BaseEntity {
  id: number;
  batchId: number;
  inventoryReceiptId: number | null;
  quantityUsed: number;
  unit: string;
  usageDate: string;
  stockBefore: number | null;
  stockAfter: number | null;

  constructor(params: { id: number; batchId: number; inventoryReceiptId?: number | null; quantityUsed: number; unit: string; usageDate: string; stockBefore?: number | null; stockAfter?: number | null }) {
    this.id = params.id;
    this.batchId = params.batchId;
    this.inventoryReceiptId = params.inventoryReceiptId ?? null;
    this.quantityUsed = params.quantityUsed;
    this.unit = params.unit;
    this.usageDate = params.usageDate;
    this.stockBefore = params.stockBefore ?? null;
    this.stockAfter = params.stockAfter ?? null;
  }
}
