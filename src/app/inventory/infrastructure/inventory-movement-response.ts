import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit } from '../domain/model/raw-material.entity';
import { InventoryMovementType } from '../domain/model/inventory-movement.entity';

/**
 * Represents an inventory movement resource received
 * from the backend API.
 *
 * @remarks
 * InventoryMovementResource defines the structure of
 * an inventory movement returned by the server.
 *
 * Each resource contains information about the affected
 * raw material, associated receipt, movement type,
 * quantity, measurement unit, stock changes, status
 * transitions, responsible actor, and occurrence date.
 *
 * This interface extends BaseResource and represents
 * data transferred through the API rather than
 * a domain entity.
 *
 * @example
 * ```typescript
 * const resource: InventoryMovementResource = {
 *   id: 1,
 *   materialId: 10,
 *   receiptId: 5,
 *   productBatchId: null,
 *   type: 'RECEIPT',
 *   amount: 100,
 *   unit: 'kg',
 *   stockBefore: 50,
 *   stockAfter: 150,
 *   statusBefore: null,
 *   statusAfter: 'AVAILABLE',
 *   reason: 'Raw material received',
 *   actorId: 2,
 *   occurredAt: '2026-10-07T10:00:00Z'
 * };
 *
 * console.log(resource.type); // 'RECEIPT'
 * console.log(resource.stockAfter); // 150
 * ```
 */
export interface InventoryMovementResource extends BaseResource {
  /**
   * The unique identifier of the inventory movement.
   */
  id: number;

  /**
   * The unique identifier of the raw material
   * affected by the inventory movement.
   */
  materialId: number;

  /**
   * The identifier of the receipt associated
   * with the inventory movement.
   */
  receiptId: number;

  /**
   * The identifier of the related product batch.
   *
   * @remarks
   * A null value indicates that the movement
   * is not associated with a product batch.
   */
  productBatchId: number | null;

  /**
   * The type of operation recorded in the inventory.
   *
   * @remarks
   * The value must correspond to one of the supported
   * InventoryMovementType values.
   */
  type: InventoryMovementType;

  /**
   * The quantity of raw material involved
   * in the inventory movement.
   *
   * @remarks
   * The quantity is expressed using the
   * measurement unit specified in unit.
   */
  amount: number;

  /**
   * The measurement unit associated with
   * the movement quantity.
   */
  unit: InventoryUnit;

  /**
   * The recorded stock quantity before
   * the inventory movement.
   *
   * @remarks
   * This value is calculated or determined
   * by the backend and included in the API response.
   */
  stockBefore: number;

  /**
   * The recorded stock quantity after
   * the inventory movement.
   *
   * @remarks
   * This value is supplied by the backend
   * and represents the resulting stock quantity.
   */
  stockAfter: number;

  /**
   * The status of the raw material before
   * the inventory movement.
   *
   * @remarks
   * A null value indicates that no previous
   * status was recorded.
   */
  statusBefore: string | null;

  /**
   * The status of the raw material after
   * the inventory movement.
   */
  statusAfter: string;

  /**
   * The reason or description explaining
   * why the inventory movement occurred.
   */
  reason: string;

  /**
   * The unique identifier of the actor
   * responsible for the inventory movement.
   */
  actorId: number;

  /**
   * The date and time when the inventory
   * movement occurred.
   *
   * @remarks
   * The timestamp is represented as a string.
   * Its exact format depends on the API contract.
   *
   * @example
   * '2026-10-07T10:00:00Z'
   */
  occurredAt: string;
}

/**
 * Represents an API response containing
 * a collection of inventory movements.
 *
 * @remarks
 * InventoryMovementsResponse defines the structure
 * of the response returned by the backend when
 * retrieving multiple inventory movement records.
 *
 * The response contains a collection of
 * InventoryMovementResource objects that represent
 * the movements returned by the server.
 *
 * This interface extends BaseResponse and is intended
 * for data exchange between the backend API
 * and the frontend application.
 *
 * @example
 * ```TypeScript
 * const response: InventoryMovementsResponse = {
 *   movements: [
 *     {
 *       id: 1,
 *       materialId: 10,
 *       receiptId: 5,
 *       productBatchId: null,
 *       type: 'RECEIPT',
 *       amount: 100,
 *       unit: 'kg',
 *       stockBefore: 50,
 *       stockAfter: 150,
 *       statusBefore: null,
 *       statusAfter: 'AVAILABLE',
 *       reason: 'Raw material received',
 *       actorId: 2,
 *       occurredAt: '2026-10-07T10:00:00Z'
 *     }
 *   ]
 * };
 *
 * console.log(response.movements.length); // 1
 * ```
 */
export interface InventoryMovementsResponse extends BaseResponse {
  /**
   * The collection of inventory movement
   * resources returned by the backend API.
   *
   * @remarks
   * Each element represents an inventory movement
   * following the InventoryMovementResource structure.
   *
   * The collection may be empty when the server
   * returns no movement records.
   */
  movements: InventoryMovementResource[];
}
