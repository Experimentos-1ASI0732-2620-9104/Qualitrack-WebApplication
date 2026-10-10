import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Defines the supported measurement units for raw materials.
 *
 * @remarks
 * Each inventory unit represents the measurement used to
 * quantify raw materials within the inventory domain.
 *
 * - kg: Kilograms.
 * - g: Grams.
 * - L: Liters.
 * - mL: Milliliters.
 * - units: Individual units.
 */
export type InventoryUnit = 'kg' | 'g' | 'L' | 'mL' | 'units';

/**
 * Defines the possible stock classifications of a raw material.
 *
 * @remarks
 * The stock status is calculated by the server based on the
 * usable stock and the configured minimum stock (US41).
 *
 * - LOW: Usable stock is below the minimum stock.
 * - SUFFICIENT: Usable stock is equal to or above the minimum stock.
 */
export type StockStatus = 'LOW' | 'SUFFICIENT';

/**
 * Represents a raw material within the inventory domain.
 *
 * @remarks
 * In Domain-Driven Design, RawMaterial is an entity within
 * the inventory bounded context that represents a material
 * registered and managed by a laboratory.
 *
 * Each raw material maintains identification information,
 * its associated laboratory and storage environment,
 * measurement unit, minimum stock, usable stock,
 * physical stock, and stock classification.
 *
 * The entity represents domain state independently of HTTP
 * resources. Stock quantities and classifications are
 * supplied by the server rather than calculated by this entity.
 *
 * @example
 * ```TypeScript
 * const material = new RawMaterial({
 *   id: 1,
 *   laboratoryId: 10,
 *   environmentId: 5,
 *   code: 'MAT-001',
 *   name: 'Wheat Flour',
 *   unit: 'kg',
 *   minimumStock: 50,
 *   usableStock: 30,
 *   physicalStock: 40,
 *   stockStatus: 'LOW',
 *   legacyId: null
 * });
 *
 * console.log(material.name); // 'Wheat Flour'
 * console.log(material.isLowStock); // true
 * ```
 */
export class RawMaterial implements BaseEntity {
  /**
   * The unique identifier of the raw material.
   */
  readonly id: number;

  /**
   * The unique identifier of the laboratory
   * associated with the raw material.
   */
  readonly laboratoryId: number;

  /**
   * The identifier of the storage environment
   * where the raw material is kept.
   *
   * @remarks
   * A null value is only used for records created
   * before storage environments were introduced.
   */
  readonly environmentId: number | null;

  /**
   * The identification code assigned to the raw material.
   *
   * @remarks
   * This code is used to identify and reference
   * the material within the inventory system.
   */
  readonly code: string;

  /**
   * The descriptive name of the raw material.
   */
  readonly name: string;

  /**
   * The measurement unit used to quantify the raw material.
   *
   * @remarks
   * The unit must correspond to one of the supported
   * InventoryUnit values.
   */
  readonly unit: InventoryUnit;

  /**
   * The minimum stock quantity configured for the raw material.
   *
   * @remarks
   * This value serves as the threshold used by the server
   * to determine whether the material has low stock.
   */
  readonly minimumStock: number;

  /**
   * The available quantity of raw material considered
   * usable for inventory operations.
   *
   * @remarks
   * This value is supplied by the server and is used
   * to determine the stock classification.
   */
  readonly usableStock: number;

  /**
   * The total physical stock quantity recorded
   * for the raw material.
   *
   * @remarks
   * This value is supplied by the server and represents
   * the recorded physical quantity of the material.
   */
  readonly physicalStock: number;

  /**
   * The current stock classification of the raw material.
   *
   * @remarks
   * The classification is calculated by the server
   * based on usableStock and minimumStock.
   *
   * A value of LOW indicates that usable stock is
   * below the configured minimum stock.
   */
  readonly stockStatus: StockStatus;

  /**
   * The identifier of the corresponding legacy material record.
   *
   * @remarks
   * A null value indicates that no legacy material
   * identifier is associated with this record.
   */
  readonly legacyId: number | null;

  /**
   * Creates a new RawMaterial entity.
   *
   * @param params - Initialization properties for the raw material.
   * @param params.id - Unique identifier of the raw material.
   * @param params.laboratoryId - Identifier of the associated laboratory.
   * @param params.environmentId - Identifier of the storage environment, or null.
   * @param params.code - Identification code of the raw material.
   * @param params.name - Descriptive name of the raw material.
   * @param params.unit - Measurement unit of the raw material.
   * @param params.minimumStock - Configured minimum stock quantity.
   * @param params.usableStock - Usable stock quantity supplied by the server.
   * @param params.physicalStock - Physical stock quantity supplied by the server.
   * @param params.stockStatus - Stock classification calculated by the server.
   * @param params.legacyId - Associated legacy material identifier, or null.
   *
   * @remarks
   * The constructor initializes the raw material using
   * the provided properties.
   *
   * All properties are required, although environmentId
   * and legacyId accept null values.
   *
   * Stock quantities and classifications are received
   * from the server. The constructor does not perform
   * stock calculations or validate inventory thresholds.
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    environmentId: number | null;
    code: string;
    name: string;
    unit: InventoryUnit;
    minimumStock: number;
    usableStock: number;
    physicalStock: number;
    stockStatus: StockStatus;
    legacyId: number | null;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.environmentId = params.environmentId;
    this.code = params.code;
    this.name = params.name;
    this.unit = params.unit;
    this.minimumStock = params.minimumStock;
    this.usableStock = params.usableStock;
    this.physicalStock = params.physicalStock;
    this.stockStatus = params.stockStatus;
    this.legacyId = params.legacyId;
  }

  /**
   * Determines whether the raw material has low stock.
   *
   * @returns True if the server classified the material
   * as LOW; otherwise, false.
   *
   * @remarks
   * This getter evaluates the stockStatus property
   * without recalculating inventory quantities.
   *
   * A material is considered to have low stock when
   * its usable stock is below the configured minimum
   * stock threshold, according to the server classification.
   *
   * @example
   * ```TypeScript
   * if (material.isLowStock) {
   *   console.log('Raw material requires replenishment');
   * }
   * ```
   */
  get isLowStock(): boolean {
    return this.stockStatus === 'LOW';
  }
}
