import { ProductionStaffMember } from '../domain/model/production-staff-member.entity';
import { ProductionStaffMemberResource } from './production-staff-member-response';

/**
 * Translates the staff of Laboratory Management into the staff members of Product Batch Management.
 */
export class ProductionStaffMemberAssembler {
  toEntityFromResource(resource: ProductionStaffMemberResource): ProductionStaffMember {
    return new ProductionStaffMember({
      id: resource.id,
      fullName: resource.fullName,
      role: resource.role,
      active: resource.active,
      accessRole: resource.accessRole ?? null,
      userId: resource.userId ?? null,
    });
  }
}
