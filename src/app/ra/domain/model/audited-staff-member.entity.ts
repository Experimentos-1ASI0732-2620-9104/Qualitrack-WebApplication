import { BaseEntity } from '../../../shared/domain/model/base-entity';

/** Staff identity shown with audit activity, translated from Laboratory into Reporting & Audit. */
export class AuditedStaffMember implements BaseEntity {
  id: number;
  fullName: string;
  role: string;

  constructor(params: { id: number; fullName: string; role: string }) {
    this.id = params.id;
    this.fullName = params.fullName;
    this.role = params.role;
  }
}
