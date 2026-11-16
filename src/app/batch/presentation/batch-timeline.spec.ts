import { Batch } from '../domain/model/batch.entity';
import { EquipmentUsage, StaffParticipation } from '../domain/model/batch-participation.entity';
import {
  BatchContainer,
  BatchTraceability,
  RejectionEvidence,
  ReleaseEvidence,
  TracedRawMaterialUsage,
} from '../domain/model/batch-traceability.entity';
import { buildBatchTimeline } from './batch-timeline';

describe('buildBatchTimeline', () => {
  const batch = new Batch({
    id: 7,
    labId: 42,
    environmentId: 1,
    productId: 5,
    productName: 'Ibuprofen 400 mg',
    batchNumber: 'LOT-7',
    quantity: 1000,
    unit: 'units',
    status: 'RELEASED',
    startDate: '2026-10-05',
  });

  function trace(
    decision: { release?: ReleaseEvidence; rejection?: RejectionEvidence } = {},
  ): BatchTraceability {
    return new BatchTraceability({
      batch,
      product: { id: 5, code: 'IBU-400', name: 'Ibuprofen 400 mg' },
      rawMaterials: [
        new TracedRawMaterialUsage({
          id: 1,
          rawMaterialId: 11,
          rawMaterialName: 'Ibuprofen API',
          rawMaterialEnvironmentId: 3,
          inventoryReceiptId: 501,
          quantityUsed: 400,
          unit: 'g',
          usageDate: '2026-10-05T15:00:00Z',
          stockBefore: 2500,
          stockAfter: 2100,
        }),
        new TracedRawMaterialUsage({
          id: 2,
          rawMaterialId: 12,
          rawMaterialName: 'Starch',
          rawMaterialEnvironmentId: 3,
          inventoryReceiptId: null,
          quantityUsed: 8,
          unit: 'g',
          usageDate: '2026-10-05T16:00:00Z',
          stockBefore: null,
          stockAfter: null,
        }),
      ],
      equipment: [
        new EquipmentUsage({
          id: 1,
          batchId: 7,
          equipmentId: 9,
          equipmentName: 'V mixer',
          registeredByUserId: 31,
          registeredAt: '2026-10-05T14:00:00Z',
        }),
      ],
      staff: [
        new StaffParticipation({
          id: 1,
          batchId: 7,
          staffId: 2,
          staffName: 'Luis Quispe',
          staffRole: 'Operator',
          registeredByUserId: 27,
          registeredAt: '2026-10-05T13:00:00Z',
        }),
      ],
      release: decision.release ?? null,
      rejection: decision.rejection ?? null,
      container: new BatchContainer({
        batchId: 7,
        containerMonitorId: 31,
        containerName: null,
        environmentId: 3,
        assignedBy: 31,
        assignedAt: '2026-10-06T10:00:00Z',
      }),
    });
  }

  it('lists the records oldest first, from the start of the batch to its release', () => {
    const release = new ReleaseEvidence({
      signedByUserId: 27,
      signatureHash: 'ab12',
      signedAt: '2026-10-07T09:00:00Z',
    });
    const entries = buildBatchTimeline(trace({ release }));

    expect(entries.map((entry) => entry.kind)).toEqual([
      'started',
      'staff',
      'equipment',
      'consumption',
      'consumption',
      'stored',
      'released',
    ]);
    expect(entries[0]).toMatchObject({
      dayOnly: true,
      titleParams: { product: 'Ibuprofen 400 mg' },
    });
    expect(entries[1]).toMatchObject({ detail: 'Operator', actorUserId: 27 });
    expect(entries[3]).toMatchObject({
      titleKey: 'batch-timeline.consumption-lot',
      titleParams: { lot: 501 },
    });
    expect(entries[4].titleKey).toBe('batch-timeline.consumption');
    expect(entries[5].titleParams).toEqual({ container: '#31' });
    expect(entries[6]).toMatchObject({ tone: 'success', actorUserId: 27 });
  });

  it('closes a rejected batch with its reason at the end of the rejection day', () => {
    const rejection = new RejectionEvidence({
      rejectionDate: '2026-10-06',
      reason: 'Dissolution out of range',
    });
    const entries = buildBatchTimeline(trace({ rejection }));

    expect(entries.at(-1)).toMatchObject({
      kind: 'rejected',
      dayOnly: true,
      detail: 'Dissolution out of range',
      tone: 'danger',
    });
  });
});
