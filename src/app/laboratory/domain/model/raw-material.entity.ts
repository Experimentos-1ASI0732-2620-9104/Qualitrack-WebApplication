import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a raw material entity within the Laboratory domain.
 *
 * @remarks
 * In DDD, a RawMaterial is an entity that models an input substance managed by
 * a laboratory. It captures traceability data, supplier information, expiration,
 * and stock thresholds used for inventory monitoring.
 */
export class RawMaterial implements BaseEntity {
  /**
   * The unique numeric identifier for this raw material.
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
   * The current quantity available in stock.
   */
  quantityInStock: number;

  /**
   * The unit of measurement for stock quantities.
   */
  unit: string;

  /**
   * The minimum stock threshold used for restocking alerts.
   */
  minimumStock: number;

  /**
   * The ISO 8601 timestamp indicating when this raw material was created.
   */
  createdAt: string;

  /**
   * Creates a new RawMaterial entity.
   *
   * @param params - Initialization properties
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    name: string;
    code: string;
    supplier: string;
    batchNumber: string;
    expirationDate: string;
    quantityInStock: number;
    unit: string;
    minimumStock: number;
    createdAt: string;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.name = params.name;
    this.code = params.code;
    this.supplier = params.supplier;
    this.batchNumber = params.batchNumber;
    this.expirationDate = params.expirationDate;
    this.quantityInStock = params.quantityInStock;
    this.unit = params.unit;
    this.minimumStock = params.minimumStock;
    this.createdAt = params.createdAt;
  }
}
