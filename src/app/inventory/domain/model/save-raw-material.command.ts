
import { InventoryUnit } from './raw-material.entity';

/**
 * Represents a command to save a raw material
 * within the inventory domain.
 *
 * @remarks
 * Encapsulates the information required to request
 * the saving of a raw material in the inventory bounded context.
 *
 * The command contains the material identification code,
 * descriptive name, measurement unit, and minimum stock
 * threshold used for inventory management.
 *
 * This interface defines the data required to request
 * the operation but does not implement the business logic
 * responsible for validating or persisting the raw material.
 *
 * @example
 * ```TypeScript
 * const command: SaveRawMaterialCommand = {
 *   code: 'MAT-001',
 *   name: 'Wheat Flour',
 *   unit: 'kg',
 *   minimumStock: 50
 * };
 *
 * console.log(command.name); // 'Wheat Flour'
 * console.log(command.minimumStock); // 50
 * ```
 */
export interface SaveRawMaterialCommand {
  /**
   * The identification code assigned to the raw material.
   *
   * @remarks
   * This code is used to identify and reference
   * the raw material within the inventory system.
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
   * This value defines the threshold used by the server
   * to determine the stock classification of the material.
   *
   * When usable stock falls below this threshold,
   * the material is classified as LOW (US41).
   */
  minimumStock: number;
}

