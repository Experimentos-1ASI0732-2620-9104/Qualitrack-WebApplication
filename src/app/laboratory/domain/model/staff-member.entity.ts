import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a staff member entity within the Laboratory domain.
 *
 * @remarks
 * In Domain-Driven Design, a StaffMember is an entity that models a human actor
 * assigned to a specific laboratory. The entity keeps professional identity,
 * role, contact information, and active status for traceability and operational use.
 */
export class StaffMember implements BaseEntity {
  /**
   * The unique numeric identifier for this staff member.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory this staff member belongs to.
   */
  laboratoryId: number;

  /**
   * The full legal name of the staff member.
   */
  fullName: string;

  /**
   * The professional role or position held by the staff member.
   */
  role: string;

  /**
   * The institutional or corporate email address of the staff member.
   */
  email: string;

  /**
   * Indicates whether this staff member is currently active.
   */
  active: boolean;

  /**
   * The ISO 8601 timestamp indicating when this staff member was created.
   */
  createdAt: string;

  /**
   * Creates a new StaffMember entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric identifier
   * @param params.laboratoryId - Numeric identifier of the owning laboratory
   * @param params.fullName - Staff member full legal name
   * @param params.role - Staff member professional role
   * @param params.email - Staff member institutional email
   * @param params.active - Whether the staff member is active
   * @param params.createdAt - Creation timestamp
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    fullName: string;
    role: string;
    email: string;
    active: boolean;
    createdAt: string;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.fullName = params.fullName;
    this.role = params.role;
    this.email = params.email;
    this.active = params.active;
    this.createdAt = params.createdAt;
  }
}
