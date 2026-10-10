import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a legacy raw material within the inventory domain.
 *
 * @remarks
 * In Domain-Driven Design, LegacyMaterial defines the structure
 * of a raw material record used in the inventory bounded context.
 *
 * Each material contains identification information, measurement
 * units, available balance, supplier details, batch information,
 * and expiration date.
 *
 * This interface extends BaseEntity to maintain a consistent
 * entity structure across the domain.
 *
 * @example
 * ```TypeScript
 * const material: LegacyMaterial = {
 *   id: 1,
 *   code: 'MAT-001',
 *   name: 'Wheat Flour',
 *   unit: 'KG',
 *   balance: 150,
 *   supplier: 'Food Supplies S.A.',
 *   batchNumber: 'LOT-2026-001',
 *   expiresOn: '2026-12-31'
 * };
 *
 * console.log(material.name); // 'Wheat Flour'
 * ```
 */
export interface LegacyMaterial extends BaseEntity {
  /**
   * The unique identifier of the raw material.
   */
  id: number;

  /**
   * The identification code assigned to the raw material.
   *
   * @remarks
   * This code can be used to identify and reference
   * materials within the inventory system.
   */
  code: string;

  /**
   * The descriptive name of the raw material.
   */
  name: string;

  /**
   * The measurement unit used to quantify the raw material.
   *
   * @example
   * 'KG', 'L', 'UN'
   */
  unit: string;

  /**
   * The recorded inventory balance of the raw material.
   *
   * @remarks
   * The balance represents the quantity associated with
   * the material, expressed in its corresponding unit.
   */
  balance: number;

  /**
   * The name or identification of the supplier
   * associated with the raw material.
   */
  supplier: string;

  /**
   * The batch or lot number assigned to the raw material.
   *
   * @remarks
   * This value supports material identification and
   * traceability across inventory operations.
   */
  batchNumber: string;

  /**
   * The expiration date of the raw material.
   *
   * @remarks
   * The date is represented as a string.
   * Its exact format depends on the data source.
   *
   * @example
   * '2026-12-31'
   */
  expiresOn: string;
}
