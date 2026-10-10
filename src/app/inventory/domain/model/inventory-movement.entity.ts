import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { InventoryUnit } from './raw-material.entity';

/**
 * Defines the supported types of inventory movements.
 *
 * @remarks
 * Each movement type identifies the operation that caused
 * a change or registration in the inventory.
 *
 * - RECEIPT: Records the receipt of raw materials.
 * - REVIEW: Records an inventory review.
 * - CONSUMPTION: Records the consumption of raw materials.
 * - OPENING_BALANCE: Records an initial inventory balance.
 * - STORAGE: Records a storage-related operation.
 */
export type InventoryMovementType =
  'RECEIPT' | 'REVIEW' | 'CONSUMPTION' | 'OPENING_BALANCE' | 'STORAGE';

/**
 * Represents an inventory movement within the inventory domain.
 *
 * @remarks
 * In Domain-Driven Design, InventoryMovement is an entity
 * that belongs to the inventory bounded context and represents
 * a recorded operation involving raw materials.
 *
 * Each movement maintains information about the affected material,
 * movement type, quantity, inventory unit, stock levels, status
 * changes, responsible actor, and occurrence date.
 *
 * The entity represents domain state independently of HTTP
 * resources. Stock values are supplied by the server rather
 * than calculated by this entity.
 *
 * @example
 * ```TypeScript
 * const movement = new InventoryMovement({
 *   id: 1,
 *   materialId: 10,
 *   receiptId: 5,
 *   productBatchId: null,
 *   type: 'RECEIPT',
 *   amount: 100,
 *   unit: 'KG' as InventoryUnit,
 *   stockBefore: 50,
 *   stockAfter: 150,
 *   statusBefore: null,
 *   statusAfter: 'AVAILABLE',
 *   reason: 'Raw material received',
 *   actorId: 2,
 *   occurredAt: '2026-10-07T10:00:00Z'
 * });
 *
 * console.log(movement.stockAfter); // 150
 * ```
 */
export class InventoryMovement implements BaseEntity {
  /**
   * The unique identifier of the inventory movement.
   */
  readonly id: number;

  /**
   * The unique identifier of the raw material affected
   * by this inventory movement.
   */
  readonly materialId: number;

  /**
   * The identifier of the receipt associated with
   * this inventory movement.
   */
  readonly receiptId: number;

  /**
   * The identifier of the related product batch.
   *
   * @remarks
   * A null value indicates that the movement is not
   * associated with a product batch.
   */
  readonly productBatchId: number | null;

  /**
   * The type of operation recorded in the inventory.
   *
   * @remarks
   * The value must correspond to one of the supported
   * InventoryMovementType values.
   */
  readonly type: InventoryMovementType;

  /**
   * The quantity of raw material involved in the movement.
   *
   * @remarks
   * The quantity is expressed using the unit specified
   * in the unit property.
   */
  readonly amount: number;

  /**
   * The measurement unit associated with the movement quantity.
   */
  readonly unit: InventoryUnit;

  /**
   * The recorded stock quantity before the inventory movement.
   *
   * @remarks
   * This value is supplied by the server.
   */
  readonly stockBefore: number;

  /**
   * The recorded stock quantity after the inventory movement.
   *
   * @remarks
   * This value is supplied by the server and reflects
   * the resulting inventory stock.
   */
  readonly stockAfter: number;

  /**
   * The status of the raw material before the movement.
   *
   * @remarks
   * A null value indicates that no previous status
   * was recorded.
   */
  readonly statusBefore: string | null;

  /**
   * The status of the raw material after the movement.
   */
  readonly statusAfter: string;

  /**
   * The reason or description explaining why
   * the inventory movement was recorded.
   */
  readonly reason: string;

  /**
   * The unique identifier of the actor responsible
   * for the inventory movement.
   */
  readonly actorId: number;

  /**
   * The date and time when the inventory movement occurred.
   *
   * @remarks
   * The timestamp is represented as a string.
   * Its exact format depends on the server response.
   */
  readonly occurredAt: string;

  /**
   * Creates a new InventoryMovement entity.
   *
   * @param params - Initialization properties for the movement.
   * @param params.id - Unique identifier of the movement.
   * @param params.materialId - Identifier of the affected raw material.
   * @param params.receiptId - Identifier of the associated receipt.
   * @param params.productBatchId - Identifier of the related product batch, or null.
   * @param params.type - Type of inventory movement.
   * @param params.amount - Quantity involved in the movement.
   * @param params.unit - Measurement unit of the quantity.
   * @param params.stockBefore - Stock quantity before the movement.
   * @param params.stockAfter - Stock quantity after the movement.
   * @param params.statusBefore - Previous material status, or null.
   * @param params.statusAfter - Material status after the movement.
   * @param params.reason - Reason for recording the movement.
   * @param params.actorId - Identifier of the responsible actor.
   * @param params.occurredAt - Date and time of the movement.
   *
   * @remarks
   * The constructor initializes the inventory movement using
   * the provided properties.
   *
   * All properties are required, although productBatchId and
   * statusBefore accept null values.
   *
   * The entity does not calculate stock changes or validate
   * movement operations. These responsibilities are handled
   * outside this entity.
   */
  constructor(params: {
    id: number;
    materialId: number;
    receiptId: number;
    productBatchId: number | null;
    type: InventoryMovementType;
    amount: number;
    unit: InventoryUnit;
    stockBefore: number;
    stockAfter: number;
    statusBefore: string | null;
    statusAfter: string;
    reason: string;
    actorId: number;
    occurredAt: string;
  }) {
    this.id = params.id;
    this.materialId = params.materialId;
    this.receiptId = params.receiptId;
    this.productBatchId = params.productBatchId;
    this.type = params.type;
    this.amount = params.amount;
    this.unit = params.unit;
    this.stockBefore = params.stockBefore;
    this.stockAfter = params.stockAfter;
    this.statusBefore = params.statusBefore;
    this.statusAfter = params.statusAfter;
    this.reason = params.reason;
    this.actorId = params.actorId;
    this.occurredAt = params.occurredAt;
  }
}
