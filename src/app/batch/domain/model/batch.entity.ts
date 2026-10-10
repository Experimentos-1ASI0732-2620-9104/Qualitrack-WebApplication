import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Lifecycle status of a product batch.
 *
 * @remarks
 * A batch starts as `PENDING`, moves to `IN_PROGRESS` with its first raw material consumption and
 * ends as `RELEASED` or `REJECTED`.
 */
export type BatchStatus = 'PENDING' | 'IN_PROGRESS' | 'RELEASED' | 'REJECTED';

/**
 * One manufacturing run of a pharmaceutical product.
 *
 * @remarks
 * In Domain-Driven Design, `Batch` is the aggregate root of the Product Batch bounded context. A batch is
 * addressed through its laboratory, environment and product. Batches registered before environments
 * existed have a null environment and can only be listed.
 *
 * @example
 * ```typescript
 * const batch = new Batch({
 *   id: 101,
 *   labId: 1,
 *   environmentId: 3,
 *   productId: 12,
 *   productName: 'Paracetamol 500 mg',
 *   batchNumber: 'L-2026-001',
 *   quantity: 1000,
 *   unit: 'units',
 *   status: 'PENDING',
 *   startDate: '2026-10-05'
 * });
 *
 * console.log(batch.isOpen); // true
 * ```
 *
 * @author Qualitrack
 */
export class Batch implements BaseEntity {
  /**
   * The unique numeric identifier of the batch.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns the batch.
   */
  labId: number;

  /**
   * The numeric identifier of the environment where the batch is produced; null for batches registered
   * before environments existed.
   */
  environmentId: number | null;

  /**
   * The numeric identifier of the product being manufactured.
   */
  productId: number;

  /**
   * The display name of the product being manufactured.
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
   * The production unit of the quantity (e.g., 'units', 'kg').
   */
  unit: string;

  /**
   * The current lifecycle status of the batch.
   */
  status: BatchStatus;

  /**
   * The start date of the manufacturing run (yyyy-MM-dd).
   */
  startDate: string;

  /**
   * The optional end date of the manufacturing run.
   */
  endDate?: string;

  /**
   * Optional manufacturing notes.
   */
  notes?: string;

  /**
   * Container monitor of the container where the batch is stored; null while it has none.
   */
  containerMonitorId: number | null;

  /**
   * Creates a new Batch entity.
   *
   * @param params - Initialization properties
   * @param params.id - The unique numeric identifier of the batch
   * @param params.labId - The owning laboratory identifier
   * @param params.environmentId - The environment identifier, or null for legacy batches
   * @param params.productId - The manufactured product identifier
   * @param params.productName - The name of the manufactured product
   * @param params.batchNumber - The traceability code of the batch
   * @param params.quantity - The quantity to produce
   * @param params.unit - The production unit
   * @param params.status - The lifecycle status
   * @param params.startDate - The start date (yyyy-MM-dd)
   * @param params.endDate - The optional end date
   * @param params.notes - The optional manufacturing notes
   * @param params.containerMonitorId - The container monitor where the batch is stored; defaults to null
   */
  constructor(params: {
    id: number;
    labId: number;
    environmentId: number | null;
    productId: number;
    productName: string;
    batchNumber: string;
    quantity: number;
    unit: string;
    status: BatchStatus;
    startDate: string;
    endDate?: string;
    notes?: string;
    containerMonitorId?: number | null;
  }) {
    this.id = params.id;
    this.labId = params.labId;
    this.environmentId = params.environmentId;
    this.productId = params.productId;
    this.productName = params.productName;
    this.batchNumber = params.batchNumber;
    this.quantity = params.quantity;
    this.unit = params.unit;
    this.status = params.status;
    this.startDate = params.startDate;
    this.endDate = params.endDate;
    this.notes = params.notes;
    this.containerMonitorId = params.containerMonitorId ?? null;
  }

  /**
   * Indicates whether the batch is still open.
   *
   * @remarks
   * Pending and in-progress batches still accept consumptions, equipment and staff.
   *
   * @returns True when the status is `PENDING` or `IN_PROGRESS`.
   */
  get isOpen(): boolean {
    return this.status === 'PENDING' || this.status === 'IN_PROGRESS';
  }

  /**
   * Gets the route of the batch detail.
   *
   * @returns The router link segments, or null when the batch has no environment yet.
   */
  get detailLink(): (string | number)[] | null {
    return this.environmentId === null
      ? null
      : [
          '/batches/environments',
          this.environmentId,
          'products',
          this.productId,
          'batches',
          this.id,
      ];
  }
}
