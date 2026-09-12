import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a production batch within the manufacturing domain.
 *
 * @remarks
 * In Domain-Driven Design, a Batch is an entity in the laboratory bounded context
 * that tracks the manufacturing lifecycle of a product. Each batch has a unique identity
 * that persists throughout its lifecycle, from creation to its final release or rejection.
 *
 * This entity models the core concept of a batch as understood within the
 * production and quality control domain, managing its state and traceability.
 *
 * @example
 * ```typescript
 * const productBatch = new Batch({
 * id: 1,
 * labId: 101,
 * productId: 890,
 * productName: 'Ibuprofen 400mg',
 * batchNumber: 'LOTE-2026A',
 * quantity: 5000,
 * unit: 'units',
 * status: 'IN_PROGRESS',
 * startDate: '2026-05-12T08:00:00Z',
 * createdAt: '2026-05-12T07:30:00Z'
 * });
 *
 * console.log(productBatch.batchNumber); // 'LOTE-2026A'
 * ```
 *
 * @author Qualitrack
 */
export class Batch implements BaseEntity {
  /**
   * The unique numeric identifier for this batch.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory responsible for this batch.
   */
  labId: number;

  /**
   * The numeric identifier of the product being manufactured.
   */
  productId: number;

  /**
   * The display name of the product.
   */
  productName: string;

  /**
   * The alphanumeric traceability code assigned to this specific batch run.
   */
  batchNumber: string;

  /**
   * The total volume or amount produced in this batch.
   */
  quantity: number;

  /**
   * The unit of measurement for the batch quantity (e.g., 'kg', 'ml', 'units').
   */
  unit: string;

  /**
   * The current stage in the batch's manufacturing lifecycle.
   */
  status: 'PENDING' | 'IN_PROGRESS' | 'RELEASED' | 'REJECTED';

  /**
   * The ISO date string representing when the batch processing began.
   */
  startDate: string;

  /**
   * The ISO date string representing when the batch processing concluded.
   */
  endDate?: string;

  /**
   * Optional domain-specific remarks or quality control observations.
   */
  notes?: string;

  /**
   * The ISO date string representing the exact moment this entity was created.
   */
  createdAt: string;

  /**
   * Creates a new Batch entity.
   *
   * @param params - Initialization properties
   * @param params.id - The unique numeric identifier for the batch
   * @param params.labId - The numeric laboratory identifier
   * @param params.productId - The numeric product identifier
   * @param params.productName - The product display name
   * @param params.batchNumber - The specific traceability code for the batch
   * @param params.quantity - The total amount produced
   * @param params.unit - The unit of measurement for the quantity
   * @param params.status - The current manufacturing status
   * @param params.startDate - The start date of the batch processing
   * @param params.endDate - The end date of the batch processing (optional)
   * @param params.notes - Additional observations or remarks (optional)
   * @param params.createdAt - The creation timestamp of the record
   *
   * @remarks
   * Constructor initializes the batch with the provided values. The entity
   * requires all mandatory manufacturing and traceability data to be created.
   */
  constructor(params: {
    id: number;
    labId: number;
    productId: number;
    productName: string;
    batchNumber: string;
    quantity: number;
    unit: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'RELEASED' | 'REJECTED';
    startDate: string;
    endDate?: string;
    notes?: string;
    createdAt: string;
  }) {
    this.id = params.id;
    this.labId = params.labId;
    this.productId = params.productId;
    this.productName = params.productName;
    this.batchNumber = params.batchNumber;
    this.quantity = params.quantity;
    this.unit = params.unit;
    this.status = params.status;
    this.startDate = params.startDate;
    this.endDate = params.endDate;
    this.notes = params.notes;
    this.createdAt = params.createdAt;
  }
}
