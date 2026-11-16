import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Staff member of the laboratory who can take part in a production batch.
 *
 * @remarks
 * Laboratory Management registers the staff and their accounts; Product Batch Management only keeps who can be assigned
 * (Customer/Supplier relation Laboratory → Product Batch; the backend reads it through `ExternalLaboratoryService`).
 */
export class ProductionStaffMember implements BaseEntity {
  id: number;

  fullName: string;

  /** Job title in the laboratory. */
  role: string;

  active: boolean;

  /** `OPERATOR` or `AUDITOR`; null for staff registered before accounts existed. */
  accessRole: string | null;

  /** Account the staff member signs in with; null for staff registered before accounts existed. */
  userId: number | null;

  constructor(params: {
    id: number;
    fullName: string;
    role: string;
    active: boolean;
    accessRole: string | null;
    userId: number | null;
  }) {
    this.id = params.id;
    this.fullName = params.fullName;
    this.role = params.role;
    this.active = params.active;
    this.accessRole = params.accessRole;
    this.userId = params.userId;
  }

  /** Whether the staff member can be assigned: active, with an account and not an auditor. */
  get assignable(): boolean {
    return this.active && this.userId !== null && this.accessRole !== 'AUDITOR';
  }
}
