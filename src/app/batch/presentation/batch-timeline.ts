import { StatusChipTone } from '../../shared/presentation/components/status-chip/status-chip';
import { BatchTraceability } from '../domain/model/batch-traceability.entity';

/**
 * Kind of record of the batch timeline.
 */
export type BatchTimelineKind =
  'started' | 'consumption' | 'equipment' | 'staff' | 'stored' | 'released' | 'rejected';

/**
 * One record of the batch timeline.
 */
export interface BatchTimelineEntry {
  /** Stable key of the record within the batch. */
  id: string;
  kind: BatchTimelineKind;
  /** When it happened: an instant, or a `yyyy-MM-dd` day when only the day is known. */
  at: string;
  /** Whether {@link BatchTimelineEntry.at} is a day without time. */
  dayOnly: boolean;
  /** Translation key of the title and its parameters. */
  titleKey: string;
  titleParams: Record<string, string | number>;
  /** Free text recorded with it (role, lot, rejection reason), already in the language of the record. */
  detail: string | null;
  /** User account that registered it; null when unknown. */
  actorUserId: number | null;
  icon: string;
  tone: StatusChipTone;
}

/** Order of records registered at the same moment: the life cycle of a batch. */
const ORDER: Record<BatchTimelineKind, number> = {
  started: 0,
  staff: 1,
  equipment: 2,
  consumption: 3,
  stored: 4,
  released: 5,
  rejected: 5,
};

/**
 * Instant used to sort a record.
 *
 * @remarks
 * Days without time are placed at the start of the day for the start of the batch and at its end for the
 * rejection, so they surround the records of that same day.
 */
function sortKey(entry: BatchTimelineEntry): number {
  if (!entry.dayOnly) return Date.parse(entry.at);
  const time = entry.kind === 'started' ? 'T00:00:00' : 'T23:59:59';
  return Date.parse(entry.at.slice(0, 10) + time);
}

/**
 * Builds the timeline of a batch from its traceability: start, staff and equipment that took part, raw material
 * consumptions, storage and the quality decision.
 *
 * @param trace - The traceability of the batch
 * @returns The records, oldest first
 */
export function buildBatchTimeline(trace: BatchTraceability): BatchTimelineEntry[] {
  const { batch } = trace;
  const entries: BatchTimelineEntry[] = [];

  if (batch.startDate) {
    entries.push({
      id: 'started',
      kind: 'started',
      at: batch.startDate,
      dayOnly: batch.startDate.length <= 10,
      titleKey: 'batch-timeline.started',
      titleParams: { product: trace.product?.name ?? batch.productName },
      detail: null,
      actorUserId: null,
      icon: 'play_circle',
      tone: 'neutral',
    });
  }

  for (const participation of trace.staff) {
    entries.push({
      id: `staff-${participation.id}`,
      kind: 'staff',
      at: participation.registeredAt,
      dayOnly: false,
      titleKey: 'batch-timeline.staff',
      titleParams: { name: participation.staffName },
      detail: participation.staffRole,
      actorUserId: participation.registeredByUserId,
      icon: 'person_add',
      tone: 'neutral',
    });
  }

  for (const usage of trace.equipment) {
    entries.push({
      id: `equipment-${usage.id}`,
      kind: 'equipment',
      at: usage.registeredAt,
      dayOnly: false,
      titleKey: 'batch-timeline.equipment',
      titleParams: { equipment: usage.equipmentName },
      detail: null,
      actorUserId: usage.registeredByUserId,
      icon: 'precision_manufacturing',
      tone: 'neutral',
    });
  }

  for (const usage of trace.rawMaterials) {
    entries.push({
      id: `consumption-${usage.id}`,
      kind: 'consumption',
      at: usage.usageDate,
      dayOnly: usage.usageDate.length <= 10,
      titleKey:
        usage.inventoryReceiptId === null
          ? 'batch-timeline.consumption'
          : 'batch-timeline.consumption-lot',
      titleParams: {
        material: usage.rawMaterialName,
        quantity: usage.quantityUsed,
        unit: usage.unit,
        lot: usage.inventoryReceiptId ?? '',
      },
      detail: null,
      actorUserId: null,
      icon: 'science',
      tone: 'neutral',
    });
  }

  if (trace.container) {
    entries.push({
      id: 'stored',
      kind: 'stored',
      at: trace.container.assignedAt,
      dayOnly: false,
      titleKey: 'batch-timeline.stored',
      titleParams: {
        container: trace.container.containerName ?? `#${trace.container.containerMonitorId}`,
      },
      detail: null,
      actorUserId: trace.container.assignedBy,
      icon: 'inventory_2',
      tone: 'info',
    });
  }

  if (trace.release) {
    entries.push({
      id: 'released',
      kind: 'released',
      at: trace.release.signedAt,
      dayOnly: false,
      titleKey: 'batch-timeline.released',
      titleParams: {},
      detail: null,
      actorUserId: trace.release.signedByUserId,
      icon: 'verified',
      tone: 'success',
    });
  } else if (trace.rejection) {
    entries.push({
      id: 'rejected',
      kind: 'rejected',
      at: trace.rejection.rejectionDate,
      dayOnly: trace.rejection.rejectionDate.length <= 10,
      titleKey: 'batch-timeline.rejected',
      titleParams: {},
      detail: trace.rejection.reason,
      actorUserId: null,
      icon: 'block',
      tone: 'danger',
    });
  }

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        (sortKey(a.entry) || 0) - (sortKey(b.entry) || 0) ||
        ORDER[a.entry.kind] - ORDER[b.entry.kind] ||
        a.index - b.index,
    )
    .map(({ entry }) => entry);
}
