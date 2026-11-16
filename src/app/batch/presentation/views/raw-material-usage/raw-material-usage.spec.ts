import { TracedRawMaterialUsage } from '../../../domain/model/batch-traceability.entity';
import { RawMaterialUsageComponent } from './raw-material-usage';

describe('RawMaterialUsageComponent links', () => {
  const usage = new TracedRawMaterialUsage({ id: 1, rawMaterialId: 12, rawMaterialName: 'Old material', rawMaterialEnvironmentId: null, inventoryReceiptId: null, quantityUsed: 2, unit: 'kg', usageDate: '2026-09-01', stockBefore: null, stockAfter: null });
  it('opens historical material data in Inventory', () => {
    expect(RawMaterialUsageComponent.prototype['materialLink'](usage)).toEqual(['/inventory/legacy-materials', 12]);
  });
  it('retains environment-scoped links for current receipts', () => {
    expect(RawMaterialUsageComponent.prototype['materialLink'](new TracedRawMaterialUsage({ ...usage, inventoryReceiptId: 4, rawMaterialEnvironmentId: 3 }))).toEqual(['/inventory/environments', 3, 'raw-materials', 12]);
    expect(RawMaterialUsageComponent.prototype['materialLink'](new TracedRawMaterialUsage({ ...usage, inventoryReceiptId: 4 }))).toBeNull();
  });
});
