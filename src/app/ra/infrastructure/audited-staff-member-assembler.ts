import { AuditedStaffMember } from '../domain/model/audited-staff-member.entity';
import { AuditedStaffMemberResource } from './audited-staff-member-response';

/** Translates Laboratory staff into the identity owned by Reporting & Audit. */
export class AuditedStaffMemberAssembler {
  toEntityFromResource(resource: AuditedStaffMemberResource): AuditedStaffMember {
    return new AuditedStaffMember({ id: resource.id, fullName: resource.fullName, role: resource.role });
  }
}
