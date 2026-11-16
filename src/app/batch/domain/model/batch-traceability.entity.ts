import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { Batch } from './batch.entity';
import {
  EquipmentUsage,
  StaffParticipation
} from './batch-participation.entity';

/**
 * Raw material lot consumed by a batch, with the environment where the material is kept.
 *
 * @remarks
 * Usages recorded before Inventory Management existed have no lot nor environment.
 *
 * @author Qualitrack
 */
export class TracedRawMaterialUsage implements BaseEntity {
  /**
   * The unique numeric identifier of the usage record.
   */
  id: number;

  /**
   * The numeric identifier of the raw material consumed.
   */
  rawMaterialId: number;

  /**
   * The display name of the raw material.
   */
  rawMaterialName: string;

  /**
   * The environment where the material is kept; null for usages recorded before Inventory Management.
   */
  rawMaterialEnvironmentId: number | null;

  /**
   * The inventory receipt (lot) that was consumed; null for usages recorded before Inventory Management.
   */
  inventoryReceiptId: number | null;

  /**
   * The exact amount consumed.
   */
  quantityUsed: number;

  /**
   * The unit of measurement of the consumed quantity.
   */
  unit: string;

  /**
   * The ISO date string of the moment the material was used.
   */
  usageDate: string;

  /**
   * The stock before the consumption; null when not recorded.
   */
  stockBefore: number | null;

  /**
   * The stock after the consumption; null when not recorded.
   */
  stockAfter: number | null;

  constructor(params: {
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
  }) {
    this.id = params.id;
    this.rawMaterialId = params.rawMaterialId;
    this.rawMaterialName = params.rawMaterialName;
    this.rawMaterialEnvironmentId = params.rawMaterialEnvironmentId;
    this.inventoryReceiptId = params.inventoryReceiptId;
    this.quantityUsed = params.quantityUsed;
    this.unit = params.unit;
    this.usageDate = params.usageDate;
    this.stockBefore = params.stockBefore;
    this.stockAfter = params.stockAfter;
  }
}

/**
 * Signature stored when a batch is released.
 *
 * @remarks
 * The signature is a SHA-256 hash built from the signing user and the time of the release.
 *
 * @author Qualitrack
 */
export class ReleaseEvidence {
  /**
   * The identifier of the user who signed the release.
   */
  signedByUserId: number;

  /**
   * The SHA-256 digital signature of the release.
   */
  signatureHash: string;

  /**
   * The ISO date string of the moment the release was signed.
   */
  signedAt: string;

  constructor(params: {
    signedByUserId: number;
    signatureHash: string;
    signedAt: string;
  }) {
    this.signedByUserId = params.signedByUserId;
    this.signatureHash = params.signatureHash;
    this.signedAt = params.signedAt;
  }
}

/**
 * Reason kept when a batch is rejected.
 *
 * @author Qualitrack
 */
export class RejectionEvidence {
  /**
   * The ISO date string of the moment the rejection was formalized.
   */
  rejectionDate: string;

  /**
   * The justification of the rejection.
   */
  reason: string;

  constructor(params: {
    rejectionDate: string;
    reason: string;
  }) {
    this.rejectionDate = params.rejectionDate;
    this.reason = params.reason;
  }
}

/**
 * Monitored container of a product storage environment where the batch is stored.
 *
 * @author Qualitrack
 */
export class BatchContainer {
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

  constructor(params: {
    batchId: number;
    containerMonitorId: number;
    containerName: string | null;
    environmentId: number;
    assignedBy: number;
    assignedAt: string;
  }) {
    this.batchId = params.batchId;
    this.containerMonitorId = params.containerMonitorId;
    this.containerName = params.containerName;
    this.environmentId = params.environmentId;
    this.assignedBy = params.assignedBy;
    this.assignedAt = params.assignedAt;
  }
}

/**
 * Everything that took part in a product batch: consumed lots, equipment, staff, the container where it is
 * stored and the final decision.
 *
 * @remarks
 * It is the read model behind the traceability tab and the batch report. `release` and `rejection` are
 * mutually exclusive and both are null while the batch is still open.
 *
 * @example
 * ```typescript
 * declare const traceability: BatchTraceability;
 *
 * console.log(traceability.rawMaterials.length);
 * console.log(traceability.release?.signedAt);
 * ```
 *
 * @author Qualitrack
 */
export class BatchTraceability {
  /**
   * The batch being traced.
   */
  batch: Batch;

  /**
   * Summary of the product manufactured in the batch.
   */
  product: {
    id: number;
    code: string;
    name: string
  };

  /**
   * The raw material lots consumed by the batch.
   */
  rawMaterials: TracedRawMaterialUsage[];

  /**
   * The equipment used in the batch.
   */
  equipment: EquipmentUsage[];

  /**
   * The staff members who took part in the batch.
   */
  staff: StaffParticipation[];

  /**
   * The signature of the release; null when the batch was not released.
   */
  release: ReleaseEvidence | null;

  /**
   * The reason of the rejection; null when the batch was not rejected.
   */
  rejection: RejectionEvidence | null;

  /**
   * The container where the batch is stored; null while it has none.
   */
  container: BatchContainer | null;

  constructor(params: {
    batch: Batch;
    product: { id: number; code: string; name: string };
    rawMaterials: TracedRawMaterialUsage[];
    equipment: EquipmentUsage[];
    staff: StaffParticipation[];
    release: ReleaseEvidence | null;
    rejection: RejectionEvidence | null;
    container: BatchContainer | null;
  }) {
    this.batch = params.batch;
    this.product = params.product;
    this.rawMaterials = params.rawMaterials;
    this.equipment = params.equipment;
    this.staff = params.staff;
    this.release = params.release;
    this.rejection = params.rejection;
    this.container = params.container;
  }
}
