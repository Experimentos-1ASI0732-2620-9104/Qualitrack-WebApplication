import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a laboratory entity within the Laboratory domain.
 *
 * @remarks
 * In Domain-Driven Design, a Laboratory is an entity that models a physical or legal
 * laboratory organization within the system. Each laboratory has a unique identity
 * that persists throughout its lifecycle, along with regulatory and contact information.
 *
 * This entity encapsulates the core attributes of a laboratory as understood within
 * the domain, including its legal tax identifier (RUC), contact details, and the
 * set of applicable regulations it must comply with.
 *
 * @example
 * ```typescript
 * const lab = new Laboratory({
 *   id: 1,
 *   name: 'BioLab Peru S.A.C.',
 *   ruc: '20512345678',
 *   address: 'Av. Industrial 456, Lima',
 *   phone: '+51 1 234-5678',
 *   applicableRegulations: ['ISO 17025', 'DIGEMID'],
 *   createdAt: '2024-01-15T08:00:00Z',
 *   updatedAt: '2024-06-10T12:30:00Z',
 * });
 *
 * console.log(lab.name); // 'BioLab Peru S.A.C.'
 * console.log(lab.applicableRegulations); // ['ISO 17025', 'DIGEMID']
 * ```
 */
export class Laboratory implements BaseEntity {
  /**
   * The unique numeric identifier for this laboratory.
   */
  id: number;

  /**
   * The official registered name of the laboratory.
   */
  name: string;

  /**
   * The tax identification number (RUC) of the laboratory.
   *
   * @remarks
   * RUC (Registro Único de Contribuyentes) is the unique taxpayer registry
   * number used in Peru to identify legal entities.
   */
  ruc: string;

  /**
   * The physical address of the laboratory.
   */
  address: string;

  /**
   * The contact phone number of the laboratory.
   */
  phone: string;

  /**
   * The list of regulatory frameworks or standards applicable to this laboratory.
   *
   * @remarks
   * Each entry represents a regulation, standard, or certification (e.g., ISO 17025,
   * DIGEMID, GMP) that the laboratory is required to comply with. This list may
   * evolve as regulatory requirements change.
   */
  applicableRegulations: string[];

  /**
   * The ISO 8601 timestamp indicating when this laboratory record was created.
   */
  createdAt: string;

  /**
   * The ISO 8601 timestamp indicating when this laboratory record was last updated.
   */
  updatedAt: string;

  /**
   * Creates a new Laboratory entity.
   *
   * @remarks
   * The constructor initializes all fields directly from the provided params object.
   * All fields are required and no defaults are applied:
   *
   * - `id`: the unique numeric identifier for the laboratory.
   * - `name`: the official registered name of the laboratory.
   * - `ruc`: the tax identification number (RUC) of the laboratory.
   * - `address`: the physical address of the laboratory.
   * - `phone`: the contact phone number of the laboratory.
   * - `applicableRegulations`: the list of applicable regulatory frameworks.
   * - `createdAt`: the creation timestamp in ISO 8601 format.
   * - `updatedAt`: the last update timestamp in ISO 8601 format.
   *
   * @param params - Initialization properties, one per field of the entity
   */
  constructor(params: {
    id: number;
    name: string;
    ruc: string;
    address: string;
    phone: string;
    applicableRegulations: string[];
    createdAt: string;
    updatedAt: string;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.ruc = params.ruc;
    this.address = params.address;
    this.phone = params.phone;
    this.applicableRegulations = params.applicableRegulations;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
