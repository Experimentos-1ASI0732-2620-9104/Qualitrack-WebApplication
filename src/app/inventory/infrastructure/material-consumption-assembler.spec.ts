import { MaterialConsumption } from '../domain/model/material-consumption.entity';
import { MaterialConsumptionAssembler } from './material-consumption-assembler';

describe('MaterialConsumptionAssembler', () => {
  const base = { id: 1, batchId: 9, quantityUsed: 12.5, unit: 'KG', usageDate: '2026-10-01T10:00:00Z' };
  it('preserves quantities and receipt identifiers used by the quality warning', () => {
    const entity = new MaterialConsumptionAssembler().toEntityFromResource({ ...base, inventoryReceiptId: 3 });
    expect(entity).toBeInstanceOf(MaterialConsumption);
    expect(entity).toEqual({ ...base, inventoryReceiptId: 3, stockBefore: null, stockAfter: null });
  });
  it.each([undefined, null])('preserves history without an inventory receipt: %s', (inventoryReceiptId) => {
    const entity = new MaterialConsumptionAssembler().toEntityFromResource({ ...base, inventoryReceiptId });
    expect(entity.inventoryReceiptId).toBeNull();
    expect(entity.batchId).toBe(9);
  });
});
