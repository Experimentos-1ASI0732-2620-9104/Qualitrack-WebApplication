
import { InventoryUnit } from '../domain/model/raw-material.entity';

/**
 * Request resource for saving a raw material
 * through the backend API.
 *
 * @remarks
 * In Domain-Driven Design, SaveRawMaterialRequest is an
 * infrastructure-level request contract that defines
 * the data required to save a raw material.
 *
 * The request includes the material identification code,
 * descriptive name, measurement unit, and minimum stock
 * threshold used for inventory management.
 *
 * This interface serves as a data transfer structure
 * between the frontend and backend, without implementing
 * domain logic or validation rules.
 *
 * It separates the API request representation from
 * the SaveRawMaterialCommand defined in the domain layer.
 */
export interface SaveRawMaterialRequest {
  /**
   * The identification code assigned to the raw material.
   *
   * @remarks
   * This code is used to identify and reference
   * the material within the inventory system.
   */
  code: string;

  /**
   * The descriptive name of the raw material.
   *
   * @remarks
   * This value provides a human-readable identification
   * of the material within inventory operations.
   */
  name: string;

  /**
   * The measurement unit used to quantify the raw material.
   *
   * @remarks
   * The unit must correspond to one of the supported
   * InventoryUnit values: kg, g, L, mL, or units.
   */
  unit: InventoryUnit;

  /**
   * The minimum stock quantity configured for the raw material.
   *
   * @remarks
   * This value defines the threshold used by the backend
   * to determine the stock classification of the material.
   *
   * When usable stock falls below this threshold,
   * the material is classified as LOW (US41).
   */
  minimumStock: number;
}

