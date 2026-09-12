import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a pharmaceutical product entity within the Laboratory domain.
 *
 * @remarks
 * In DDD, a PharmaceuticalProduct is an entity registered under a laboratory.
 * It captures product identity, catalog code, descriptive information, technical
 * specifications, and active state for operational traceability.
 */
export class PharmaceuticalProduct implements BaseEntity {
  /**
   * The unique numeric identifier for this pharmaceutical product.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns this product.
   */
  laboratoryId: number;

  /**
   * The internal catalog code that identifies this product.
   */
  code: string;

  /**
   * The commercial or scientific name of the product.
   */
  name: string;

  /**
   * A human-readable product description.
   */
  description: string;

  /**
   * The technical specifications of the product.
   */
  specifications: string;

  /**
   * Indicates whether this product is active.
   */
  active: boolean;

  /**
   * The ISO 8601 timestamp indicating when this product was created.
   */
  createdAt: string;

  /**
   * Creates a new PharmaceuticalProduct entity.
   *
   * @param params - Initialization properties
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    code: string;
    name: string;
    description: string;
    specifications: string;
    active: boolean;
    createdAt: string;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.code = params.code;
    this.name = params.name;
    this.description = params.description;
    this.specifications = params.specifications;
    this.active = params.active;
    this.createdAt = params.createdAt;
  }
}
