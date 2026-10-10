
import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit, StockStatus } from '../domain/model/raw-material.entity';

/**
 * Resource representation of a raw material for API communication.
 *
 * @remarks
 * In Domain-Driven Design, RawMaterialResource is an infrastructure-level
 * resource contract that represents a raw material as returned by the
 * backend API, without implementing domain logic.
 *
 * This resource contains material identification, laboratory and storage
 * environment references, measurement unit, minimum stock, usable stock,
 * physical stock, stock classification, and legacy material information.
 *
 * Stock quantities and classifications are supplied by the server.
 * The resource serves as a data transfer structure between the backend
 * and frontend and can be converted into a RawMaterial domain entity
 * through the corresponding assembler.
 */
export interface RawMaterialResource extends BaseResource {
  /**
   * The unique identifier of the raw material.
   */
  id: number;

  /**
   * The unique identifier of the laboratory
   * associated with the raw material.
   */
  laboratoryId: number;

  /**
   * The identifier of the storage environment
   * where the raw material is registered.
   *
   * @remarks
   * A null value indicates a record created before
   * storage environments were introduced.
   */
  environmentId: number | null;

  /**
   * The identification code assigned to the raw material.
   */
  code: string;

  /**
   * The descriptive name of the raw material.
   */
  name: string;

  /**
   * The measurement unit used to quantify the raw material.
   *
   * @remarks
   * The value must correspond to one of the supported
   * InventoryUnit values: kg, g, L, mL, or units.
   */
  unit: InventoryUnit;

  /**
   * The minimum stock quantity configured for the raw material.
   *
   * @remarks
   * This value defines the threshold used by the server
   * to determine the stock classification (US41).
   */
  minimumStock: number;

  /**
   * The quantity of raw material considered usable
   * for inventory operations.
   *
   * @remarks
   * This value is supplied by the backend and is used
   * to determine the material's stock classification.
   */
  usableStock: number;

  /**
   * The recorded physical stock quantity of the raw material.
   *
   * @remarks
   * This value is supplied by the backend and represents
   * the physical quantity registered in the inventory.
   */
  physicalStock: number;

  /**
   * The current stock classification of the raw material.
   *
   * @remarks
   * The classification is calculated by the server
   * based on usableStock and minimumStock.
   *
   * - LOW: Usable stock is below the minimum stock.
   * - SUFFICIENT: Usable stock is equal to or above
   *   the minimum stock.
   */
  stockStatus: StockStatus;

  /**
   * The identifier of the associated legacy material record.
   *
   * @remarks
   * A null value indicates that the raw material
   * has no associated legacy material identifier.
   */
  legacyId: number | null;
}

/**
 * Response envelope for raw material collection queries.
 *
 * @remarks
 * RawMaterialsResponse defines the structure of API responses
 * that return multiple raw material resources.
 *
 * The response contains a collection of RawMaterialResource objects,
 * each representing a raw material registered in the inventory system.
 *
 * This interface extends BaseResponse and follows the response
 * envelope pattern to maintain a consistent structure for
 * communication between the backend and frontend.
 *
 * The returned resources can be transformed into RawMaterial
 * domain entities through the corresponding assembler.
 */
export interface RawMaterialsResponse extends BaseResponse {
  /**
   * The collection of raw material resources
   * included in the API response.
   *
   * @remarks
   * Contains zero or more RawMaterialResource objects,
   * each representing a raw material that can be
   * converted into a RawMaterial domain entity.
   *
   * An empty array indicates that no raw material
   * resources were included in the response.
   */
  rawMaterials: RawMaterialResource[];
}

