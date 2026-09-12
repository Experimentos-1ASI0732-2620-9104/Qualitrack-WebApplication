import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a raw material for API communication.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and mirrors the backend
 * raw material resource contract. Backend field names such as `currentStock`
 * and `minimumThreshold` are mapped to the frontend domain names
 * `quantityInStock` and `minimumStock` by the assembler.
 */
export interface RawMaterialResource extends BaseResource {
  /**
   * The unique numeric identifier of the raw material.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns this raw material.
   */
  laboratoryId: number;

  /**
   * The common or chemical name of the raw material.
   */
  name: string;

  /**
   * The internal catalog code of the raw material.
   */
  code: string;

  /**
   * The supplier or vendor name.
   */
  supplier: string;

  /**
   * The supplier batch or lot number.
   */
  batchNumber: string;

  /**
   * The expiration date in ISO date format.
   */
  expirationDate: string;

  /**
   * The current quantity available in stock as returned by the backend.
   */
  currentStock: number;

  /**
   * The unit of measurement for stock quantities.
   */
  unit: string;

  /**
   * The minimum stock threshold as returned by the backend.
   */
  minimumThreshold: number;

  /**
   * The ISO 8601 timestamp indicating when the raw material was created.
   */
  createdAt: string;
}

/**
 * Response envelope for raw material collection queries.
 *
 * @remarks
 * This response is used when the backend returns raw materials inside a
 * collection wrapper.
 */
export interface RawMaterialsResponse extends BaseResponse {
  /**
   * Array of raw material resources returned by the API.
   */
  rawMaterials: RawMaterialResource[];
}
