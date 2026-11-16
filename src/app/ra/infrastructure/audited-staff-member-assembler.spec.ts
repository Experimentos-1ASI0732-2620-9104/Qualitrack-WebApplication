import { AuditedStaffMember } from '../domain/model/audited-staff-member.entity';
import { AuditedStaffMemberAssembler } from './audited-staff-member-assembler';

describe('AuditedStaffMemberAssembler', () => {
  it('keeps the audit identity without copying account or personal data', () => {
    const resource = { id: 4, fullName: 'Ana Pérez', role: 'Operator', email: 'private@example.test', userId: 99 };
    const member = new AuditedStaffMemberAssembler().toEntityFromResource(resource);
    expect(member).toBeInstanceOf(AuditedStaffMember);
    expect(member).toEqual({ id: 4, fullName: 'Ana Pérez', role: 'Operator' });
  });
});
