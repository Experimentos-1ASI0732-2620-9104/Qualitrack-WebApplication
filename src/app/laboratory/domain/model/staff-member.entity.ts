import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * What a staff member can do with the account their quality manager created: an operator
 * registers the operations assigned to them and an auditor only consults.
 */
export type StaffAccessRole = 'OPERATOR' | 'AUDITOR';

/**
 * Represents a staff member entity within the Laboratory domain.
 *
 * @remarks
 * In Domain-Driven Design, a StaffMember is an entity that models a human actor
 * assigned to a specific laboratory. The entity keeps professional identity,
 * role, contact information, active status and the account the staff member
 * signs in with, for traceability and operational use.
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
   * The job title of the staff member in the laboratory.
   */
  role: string;

  /**
   * The corporate email address, also the username of their account.
   */
  email: string;

  /**
   * Indicates whether the staff member is currently active.
   */
  active: boolean;

  /**
   * What the staff member can do; null for staff registered before accounts existed.
   */
  accessRole: StaffAccessRole | null;

  /**
   * Account the staff member signs in with; null for staff registered before accounts existed.
   */
  userId: number | null;

  /**
   * Creates a new StaffMember instance.
   *
   * @param params - Object containing the staff member properties, one per field of the entity
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    fullName: string;
    role: string;
    email: string;
    active: boolean;
    accessRole: StaffAccessRole | null;
    userId: number | null;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.fullName = params.fullName;
    this.role = params.role;
    this.email = params.email;
    this.active = params.active;
    this.accessRole = params.accessRole;
    this.userId = params.userId;
  }

  /**
   * Indicates whether the staff member can be assigned to operations: active, with an account
   * and not an auditor.
   *
   * @returns `true` when the staff member is active, has a user account and is not an auditor
   */
  get assignable(): boolean {
    return this.active && this.userId !== null && this.accessRole !== 'AUDITOR';
  }
}
