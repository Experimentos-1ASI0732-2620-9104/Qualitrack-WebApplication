import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a raw material usage record for API communication.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this interface serves as an
 * infrastructure-level data contract. It represents the state of a raw
 * material consumption record as it is serialized for HTTP communication, entirely
 * stripped of internal domain logic or behaviors. Resources act as a
 * strict boundary, preventing domain entities from leaking directly into external
 * API layers.
 *
 * @example
 * ```typescript
 * const resource: RawMaterialUsageResource = {
 * id: 1,
 * batchId: 101,
 * rawMaterialId: 45,
 * rawMaterialName: 'Purified Water',
 * quantityUsed: 150.5,
 * unit: 'liters',
 * usageDate: '2026-05-12T09:30:00Z',
 * createdAt: '2026-05-12T09:35:00Z'
 * };
 *
 * ```
 *
 * @author Qualitrack
 */
export interface RawMaterialUsageResource extends BaseResource {
  /**
   * The unique numeric identifier for the raw material usage resource.
   */
  id: number;
  stockBefore?: number | null;
  stockAfter?: number | null;

  /**
   * The numeric identifier of the production batch associated with this usage.
   */
  batchId: number;

  /**
   * The numeric identifier of the specific raw material consumed.
   */
  rawMaterialId: number;

  /**
   * The display name of the raw material.
   */
  rawMaterialName: string;

  /**
   * The amount of raw material used in the process.
   */
  quantityUsed: number;

  /**
   * The unit of measurement for the quantity (e.g., 'kg', 'liters').
   */
  unit: string;

  /**
   * The ISO date string representing when the material was physically used.
   */
  usageDate: string;

  /**
   * The ISO date string representing the exact moment this record was created.
   */
  createdAt?: string;
}

/**
 * Response envelope for raw material usage collection queries.
 *
 * @remarks
 * This interface defines the structure of API responses that return multiple
 * raw material usage records. Utilizing an envelope pattern allows for
 * consistent metadata handling (such as pagination or status flags inherited from
 * BaseResponse) across all collection endpoints within the application's
 * infrastructure layer.
 *
 * @example
 * ```typescript
 * const apiResponse: RawMaterialUsagesResponse = {
 * rawMaterialUsages: [
 * { id: 1, rawMaterialName: 'Solvent A', ... },
 * { id: 2, rawMaterialName: 'Active Ingredient B', ... }
 * ]
 * };
 *
 * ```
 *
 * @author Qualitrack
 */
export interface RawMaterialUsagesResponse extends BaseResponse {
  /**
   * Array of raw material usage resources included in the response.
   * Contains zero or more RawMaterialUsageResource objects.
   */
  rawMaterialUsages: RawMaterialUsageResource[];
}
