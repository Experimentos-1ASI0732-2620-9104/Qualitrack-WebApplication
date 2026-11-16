/** Fields Inventory reads from the Product Batch consumption resources. */
export interface MaterialConsumptionResource {
  id: number;
  batchId: number;
  inventoryReceiptId?: number | null;
  quantityUsed: number;
  unit: string;
  usageDate: string;
  stockBefore?: number | null;
  stockAfter?: number | null;
}
