import {
  BaseResource,
  BaseResponse
} from '../../shared/infrastructure/base-response';

/**
 * Product batch as returned by the API.
 *
 * @remarks
 * Infrastructure-level data contract; {@link BatchAssembler} converts it into a domain `Batch`.
 *
 * @author Qualitrack
 */
export interface BatchResource extends BaseResource {
  /**
   * The unique numeric identifier of the batch.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns the batch.
   */
  labId: number;

  /**
   * The environment where the batch is produced; null for batches registered before environments existed.
   */
  environmentId: number | null;

  /**
   * The numeric identifier of the manufactured product.
   */
  productId: number;

  /**
   * The display name of the manufactured product.
   */
  productName: string;

  /**
   * The traceability code of the batch, unique in the laboratory.
   */
  batchNumber: string;

  /**
   * The quantity to produce.
   */
  quantity: number;

  /**
   * The production unit.
   */
  unit: string;

  /**
   * The lifecycle status as text (PENDING, IN_PROGRESS, RELEASED or REJECTED).
   */
  status: string;

  /**
   * The start date of the manufacturing run (yyyy-MM-dd).
   */
  startDate: string;

  /**
   * The optional end date of the manufacturing run.
   */
  endDate?: string | null;

  /**
   * Optional manufacturing notes.
   */
  notes?: string | null;

  /**
   * The container monitor where the batch is stored; absent or null while it has none.
   */
  containerMonitorId?: number | null;
}

/**
 * Envelope variant of a batch collection.
 *
 * @author Qualitrack
 */
export interface BatchesResponse extends BaseResponse {
  /**
   * Array of batch resources included in the response.
   */
  batches: BatchResource[];
}

/**
 * Equipment associated with a batch.
 *
 * @author Qualitrack
 */
export interface EquipmentUsageResource {
  /**
   * The unique numeric identifier of the usage record.
   */
  id: number;

  /**
   * The numeric identifier of the batch that used the equipment.
   */
  batchId: number;

  /**
   * The numeric identifier of the equipment used.
   */
  equipmentId: number;

  /**
   * The name the equipment had when it was associated with the batch.
   */
  equipmentName: string;

  /**
   * The identifier of the user who registered the usage, if known.
   */
  registeredByUserId: number | null;

  /**
   * The ISO date string of the moment the usage was registered.
   */
  registeredAt: string;
}

/**
 * Staff member associated with a batch.
 *
 * @author Qualitrack
 */
export interface StaffParticipationResource {
  /**
   * The unique numeric identifier of the participation record.
   */
  id: number;

  /**
   * The numeric identifier of the batch in which the person took part.
   */
  batchId: number;

  /**
   * The numeric identifier of the staff member.
   */
  staffId: number;

  /**
   * The name of the staff member when the participation was registered.
   */
  staffName: string;

  /**
   * The role of the staff member when the participation was registered; null when it had none.
   */
  staffRole: string | null;

  /**
   * The identifier of the user who registered the participation, if known.
   */
  registeredByUserId: number | null;

  /**
   * The ISO date string of the moment the participation was registered.
   */
  registeredAt: string;
}

/**
 * Container where a batch is stored (PUT .../batches/{batchId}/container-assignment).
 *
 * @author Qualitrack
 */
export interface BatchContainerResource {
  /**
   * The numeric identifier of the stored batch.
   */
  batchId: number;

  /**
   * The numeric identifier of the container monitor.
   */
  containerMonitorId: number;

  /**
   * Name of the container monitor; null when it is no longer registered.
   */
  containerName: string | null;

  /**
   * The numeric identifier of the environment that holds the container.
   */
  environmentId: number;

  /**
   * The identifier of the user who assigned the batch to the container.
   */
  assignedBy: number;

  /**
   * The ISO date string of the moment the batch was assigned to the container.
   */
  assignedAt: string;
}

/**
 * Traceability of a batch.
 *
 * @remarks
 * Everything that took part in the batch: consumed lots, equipment, staff, the container where it is stored
 * and the final decision. `release` and `rejection` are both null while the batch is still open.
 *
 * @author Qualitrack
 */
export interface BatchTraceabilityResource {
  /**
   * The batch being traced.
   */
  batch: BatchResource;

  /**
   * Summary of the product manufactured in the batch.
   */
  product: { id: number; code: string; name: string };

  /**
   * The raw material lots consumed by the batch; usages recorded before Inventory Management have no lot
   * nor environment.
   */
  rawMaterials: {
    id: number;
    rawMaterialId: number;
    rawMaterialName: string;
    rawMaterialEnvironmentId: number | null;
    inventoryReceiptId: number | null;
    quantityUsed: number;
    unit: string;
    usageDate: string;
    stockBefore: number | null;
    stockAfter: number | null;
  }[];

  /**
   * The equipment used in the batch.
   */
  equipment: EquipmentUsageResource[];

  /**
   * The staff members who took part in the batch.
   */
  staff: StaffParticipationResource[];

  /**
   * The signature of the release; null when the batch was not released.
   */
  release: { signedByUserId: number; signatureHash: string; signedAt: string } | null;

  /**
   * The reason of the rejection; null when the batch was not rejected.
   */
  rejection: { rejectionDate: string; reason: string } | null;

  /**
   * The container where the batch is stored; absent or null while it has none.
   */
  container?: BatchContainerResource | null;
}
