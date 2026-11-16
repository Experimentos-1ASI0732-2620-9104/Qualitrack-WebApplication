import { MaintenanceTechnician } from '../domain/model/maintenance-technician.entity';
import { MaintenanceTechnicianResource } from './maintenance-technician-response';

/**
 * Translates the staff of Laboratory Management into the staff members of Equipment Management.
 */
export class MaintenanceTechnicianAssembler {
  toEntityFromResource(resource: MaintenanceTechnicianResource): MaintenanceTechnician {
    return new MaintenanceTechnician({
      id: resource.id,
      fullName: resource.fullName,
      role: resource.role,
      active: resource.active,
      accessRole: resource.accessRole ?? null,
      userId: resource.userId ?? null,
    });
  }
}
