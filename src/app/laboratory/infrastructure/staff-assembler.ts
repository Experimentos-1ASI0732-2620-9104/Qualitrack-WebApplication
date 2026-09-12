import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { StaffMember } from '../domain/model/staff-member.entity';
import { StaffMemberResource, StaffMembersResponse } from './staff-response';

/**
 * Assembler for converting between StaffMember domain entities and API resources.
 *
 * @remarks
 * This assembler keeps staff member domain objects independent from backend
 * transport contracts.
 */
export class StaffAssembler implements BaseAssembler<
  StaffMember,
  StaffMemberResource,
  StaffMembersResponse
> {
  /**
   * Converts a staff response envelope into domain entities.
   *
   * @param response - API response containing staff member resources
   * @returns Array of StaffMember domain entities
   */
  toEntitiesFromResponse(response: StaffMembersResponse): StaffMember[] {
    return response.staffMembers.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a staff member API resource into a domain entity.
   *
   * @param resource - Staff member resource received from the API
   * @returns StaffMember domain entity
   */
  toEntityFromResource(resource: StaffMemberResource): StaffMember {
    return new StaffMember({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      fullName: resource.fullName,
      role: resource.role,
      email: resource.email,
      active: resource.active,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts a StaffMember domain entity into an API resource.
   *
   * @param entity - StaffMember domain entity
   * @returns StaffMember resource ready for API communication
   */
  toResourceFromEntity(entity: StaffMember): StaffMemberResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      fullName: entity.fullName,
      role: entity.role,
      email: entity.email,
      active: entity.active,
      createdAt: entity.createdAt,
    };
  }
}
