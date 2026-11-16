import { BatchAssembler } from './batch-assembler';
import { BatchTraceabilityResource } from './batch-response';
import { Batch } from '../domain/model/batch.entity';
import { EquipmentUsage, StaffParticipation } from '../domain/model/batch-participation.entity';
import { BatchTraceability, TracedRawMaterialUsage, ReleaseEvidence, RejectionEvidence, BatchContainer } from '../domain/model/batch-traceability.entity';

describe('BatchAssembler traceability', () => {
  const resource: BatchTraceabilityResource = {
    batch: { id: 4, labId: 1, environmentId: 3, productId: 2, productName: 'Product', batchNumber: 'PB-4', quantity: 10, unit: 'units', status: 'RELEASED', startDate: '2026-10-01' },
    product: { id: 2, code: 'P-2', name: 'Product' },
    rawMaterials: [{ id: 7, rawMaterialId: 12, rawMaterialName: 'Material', rawMaterialEnvironmentId: null, inventoryReceiptId: null, quantityUsed: 2, unit: 'kg', usageDate: '2026-10-01', stockBefore: 2, stockAfter: 0 }],
    equipment: [{ id: 8, batchId: 4, equipmentId: 2, equipmentName: 'Original mixer name', registeredByUserId: null, registeredAt: '2026-10-01' }],
    staff: [{ id: 9, batchId: 4, staffId: 3, staffName: 'Historical operator', staffRole: null, registeredByUserId: 1, registeredAt: '2026-10-01' }],
    release: { signedByUserId: 1, signatureHash: 'stored-signature', signedAt: '2026-10-02' }, rejection: null,
    container: { batchId: 4, containerMonitorId: 2, containerName: null, environmentId: 5, assignedBy: 1, assignedAt: '2026-10-02' },
  };
  it('constructs nested domain models while preserving historical snapshots, nulls and zero stock', () => {
    const trace = new BatchAssembler().toTraceabilityFromResource(resource);
    expect(trace).toBeInstanceOf(BatchTraceability); expect(trace.batch).toBeInstanceOf(Batch);
    expect(trace.rawMaterials[0]).toBeInstanceOf(TracedRawMaterialUsage);
    expect(trace.equipment[0]).toBeInstanceOf(EquipmentUsage); expect(trace.staff[0]).toBeInstanceOf(StaffParticipation);
    expect(trace.release).toBeInstanceOf(ReleaseEvidence); expect(trace.container).toBeInstanceOf(BatchContainer);
    expect(trace).toEqual(expect.objectContaining({ product: resource.product, rawMaterials: resource.rawMaterials, equipment: resource.equipment, staff: resource.staff, release: resource.release, rejection: null, container: resource.container }));
  });
  it('preserves rejection evidence and normalizes an absent container to null', () => {
    const rejection = { rejectionDate: '2026-10-03', reason: 'Quality deviation' };
    const trace = new BatchAssembler().toTraceabilityFromResource({ ...resource, release: null, rejection, container: undefined });
    expect(trace.release).toBeNull(); expect(trace.rejection).toBeInstanceOf(RejectionEvidence);
    expect(trace.rejection).toEqual(rejection); expect(trace.container).toBeNull();
  });
});
