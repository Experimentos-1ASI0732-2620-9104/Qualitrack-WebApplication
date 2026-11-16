import { LegacyMaterialSnapshot } from '../domain/model/legacy-material-snapshot.entity';
import { LegacyMaterialSnapshotAssembler } from './legacy-material-snapshot-assembler';
import { ConsumingBatch } from '../domain/model/consuming-batch.entity';
import { ConsumingBatchAssembler } from './consuming-batch-assembler';
import { MaterialConsumptionAssembler } from './material-consumption-assembler';

describe('Legacy material detail assemblers', () => {
  it('preserves zero stock, supplier information and the minimum threshold', () => {
    const material = new LegacyMaterialSnapshotAssembler().toEntityFromResource({
      id: 3, name: 'Legacy material', code: 'OLD-3', supplier: 'Supplier', batchNumber: 'OLD-LOT', expirationDate: '2026-09-01', currentStock: 0, minimumThreshold: 4, unit: 'kg',
    });
    expect(material).toBeInstanceOf(LegacyMaterialSnapshot);
    expect(material.quantityInStock).toBe(0);
    expect(material.minimumStock).toBe(4);
    expect(material.batchNumber).toBe('OLD-LOT');
    expect(material.expirationDate).toBe('2026-09-01');
  });
  it('keeps the production batch number in its own model', () => {
    const batch = new ConsumingBatchAssembler().toEntityFromResource({ id: 8, batchNumber: 'PB-8' });
    expect(batch).toBeInstanceOf(ConsumingBatch);
    expect(batch).toEqual({ id: 8, batchNumber: 'PB-8' });
  });
  it('distinguishes a recorded zero balance from unrecorded historical balances', () => {
    const assembler = new MaterialConsumptionAssembler();
    const base = { id: 2, batchId: 8, quantityUsed: 4, unit: 'kg', usageDate: '2026-09-01' };
    const recorded = assembler.toEntityFromResource({ ...base, stockBefore: 4, stockAfter: 0 });
    expect(recorded.stockBefore).toBe(4); expect(recorded.stockAfter).toBe(0);
    const old = assembler.toEntityFromResource(base);
    expect(old.stockBefore).toBeNull(); expect(old.stockAfter).toBeNull();
  });
});
