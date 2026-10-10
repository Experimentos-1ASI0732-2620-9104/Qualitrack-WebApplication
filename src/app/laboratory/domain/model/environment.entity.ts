import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnvironmentUsage } from './environment-usage';

/**
 * Represents a physical area of a laboratory or pharmaceutical warehouse.
 *
 * @remarks
 * In Domain-Driven Design, the Environment belongs to the Laboratory bounded context.
 * Other bounded contexts reference it to place raw materials, products, equipment
 * and IoT devices, and to organize environmental measurements.
 *
 * @example
 * ```typescript
 * const environment = new Environment({
 *   id: 3,
 *   laboratoryId: 1,
 *   code: 'ALM-01',
 *   name: 'Raw material warehouse',
 *   description: null,
 *   usage: 'RAW_MATERIAL_STORAGE',
 *   usageAssignedBy: 7,
 *   usageAssignedAt: '2026-05-10T14:00:00Z',
 * });
 *
 * console.log(environment.hasUsage); // true
 * ```
 */
export class Environment implements BaseEntity {
  /**
   * The unique numeric identifier of the environment.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns the environment.
   */
  laboratoryId: number;

  /**
   * Identification of the environment, unique within its laboratory.
   */
  code: string;

  /**
   * Display name of the environment.
   */
  name: string;

  /**
   * Optional description of the environment.
   */
  description: string | null;

  /**
   * Main use of the environment, or null while it has not been assigned.
   */
  usage: EnvironmentUsage | null;

  /**
   * Identifier of the user that assigned the current usage.
   */
  usageAssignedBy: number | null;

  /**
   * ISO 8601 timestamp of the current usage assignment.
   */
  usageAssignedAt: string | null;

  /**
   * Creates a new Environment entity.
   *
   * @remarks
   * Every property is copied as received; optional values must be passed as `null`.
   *
   * @param params - Initialization properties, one per field of the entity
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    code: string;
    name: string;
    description: string | null;
    usage: EnvironmentUsage | null;
    usageAssignedBy: number | null;
    usageAssignedAt: string | null;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.code = params.code;
    this.name = params.name;
    this.description = params.description;
    this.usage = params.usage;
    this.usageAssignedBy = params.usageAssignedBy;
    this.usageAssignedAt = params.usageAssignedAt;
  }

  /**
   * Indicates whether a usage has been assigned to the environment.
   *
   * @returns `true` when {@link Environment.usage} is not `null`
   */
  get hasUsage(): boolean {
    return this.usage !== null;
  }
}
