import { ProductionStaffMember } from './production-staff-member.entity';

describe('ProductionStaffMember', () => {
  const member = (changes: Partial<{ active: boolean; accessRole: string | null; userId: number | null }> = {}) =>
    new ProductionStaffMember({
      id: 4,
      fullName: 'Diego Ramírez Torres',
      role: 'Técnico de producción',
      active: true,
      accessRole: 'OPERATOR',
      userId: 12,
      ...changes,
    });

  it('can be assigned to a batch while active, with an account and not an auditor', () => {
    expect(member().assignable).toBe(true);
    expect(member({ active: false }).assignable).toBe(false);
    expect(member({ userId: null }).assignable).toBe(false);
    expect(member({ accessRole: 'AUDITOR' }).assignable).toBe(false);
  });
});
