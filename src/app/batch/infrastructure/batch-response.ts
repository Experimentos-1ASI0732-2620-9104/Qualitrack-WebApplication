import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a production batch for API communication.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this interface serves as an
 * infrastructure-level data contract. It represents the state of a batch as it
 * is serialized for HTTP communication, entirely stripped of internal domain logic
 * or behaviors. Resources act as a strict boundary, preventing domain entities
 * from leaking directly into external API layers.
 *
 * @example
 * ```typescript
 * const resource: BatchResource = {
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
 * };
 *
 * ```
 *
 * @author Qualitrack
 */
export interface BatchResource extends BaseResource {
  /**
   * The unique numeric identifier for the batch resource.
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
   * The string representation of the batch's current manufacturing status.
   */
  status: string;

  /**
   * The ISO date string representing when the batch processing began.
   */
  startDate: string;

  /**
   * The ISO date string representing when the batch processing concluded (if applicable).
   */
  endDate?: string;

  /**
   * Optional quality control observations or manufacturing remarks.
   */
  notes?: string;

  /**
   * The ISO date string representing the exact moment this record was created.
   */
  createdAt?: string;
}

/**
 * Response envelope for batch collection queries.
 *
 * @remarks
 * This interface defines the structure of API responses that return multiple
 * production batches. Utilizing an envelope pattern allows for consistent metadata
 * handling (such as pagination or status flags inherited from BaseResponse) across
 * all collection endpoints within the application's infrastructure layer.
 *
 * @example
 * ```typescript
 * const apiResponse: BatchesResponse = {
 * batches: [
 * { id: 1, batchNumber: 'LOTE-2026A', ... }
 * // ... additional BatchResource objects
 * ]
 * };
 *
 * ```
 *
 * @author Qualitrack
 */
export interface BatchesResponse extends BaseResponse {
  /**
   * Array of batch resources included in the response.
   * Contains zero or more BatchResource objects.
   */
  batches: BatchResource[];
}
