import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Pharmaceutical product manufactured in an environment of the laboratory.
 *
 * @remarks
 * Each manufacturing run of the product is a {@link Batch}. Products registered before environments
 * existed have a null environment and cannot be opened until they are assigned to one.
 *
 * @example
 * ```typescript
 * const product = new PharmaceuticalProduct({
 *   id: 12,
 *   laboratoryId: 1,
 *   environmentId: 3,
 *   code: 'PRD-001',
 *   name: 'Paracetamol 500 mg',
 *   description: null,
 *   specifications: 'Film-coated tablets, 500 mg per unit.',
 *   active: true
 * });
 *
 * console.log(`${product.code} - ${product.name}`);
 * ```
 *
 * @author Qualitrack
 */
export class PharmaceuticalProduct implements BaseEntity {
  /**
   * The unique numeric identifier of the product.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns the product.
   */
  laboratoryId: number;

  /**
   * The numeric identifier of the environment where the product is manufactured; null for products
   * registered before environments existed.
   */
  environmentId: number | null;

  /**
   * The internal catalog code, unique in the laboratory.
   */
  code: string;

  /**
   * The product name, unique in the laboratory.
   */
  name: string;

  /**
   * The optional description of the product.
   */
  description: string | null;

  /**
   * The technical specifications of the product.
   */
  specifications: string;

  /**
   * Whether the product is active; false when it was discontinued.
   */
  active: boolean;

  /**
   * Creates a new PharmaceuticalProduct entity.
   *
   * @param params - Initialization properties
   * @param params.id - The unique numeric identifier of the product
   * @param params.laboratoryId - The owning laboratory identifier
   * @param params.environmentId - The environment identifier, or null for legacy products
   * @param params.code - The internal catalog code
   * @param params.name - The product name
   * @param params.description - The optional description
   * @param params.specifications - The technical specifications
   * @param params.active - Whether the product is active
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    environmentId: number | null;
    code: string;
    name: string;
    description: string | null;
    specifications: string;
    active: boolean;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.environmentId = params.environmentId;
    this.code = params.code;
    this.name = params.name;
    this.description = params.description;
    this.specifications = params.specifications;
    this.active = params.active;
  }
}
