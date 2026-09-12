import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a staff member for API communication.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and mirrors the backend
 * staff resource contract. It is converted into a StaffMember domain entity
 * by the corresponding assembler.
 */
export interface StaffMemberResource extends BaseResource {
  /**
   * The unique numeric identifier of the staff member.
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
   * The professional role assigned to the staff member.
   */
  role: string;

  /**
   * The institutional email address of the staff member.
   */
  email: string;

  /**
   * Indicates whether the staff member is active.
   */
  active: boolean;

  /**
   * The ISO 8601 timestamp indicating when the staff member was created.
   */
  createdAt: string;
}

/**
 * Response envelope for staff collection queries.
 *
 * @remarks
 * This response is used when the backend returns staff members inside a
 * collection wrapper.
 */
export interface StaffMembersResponse extends BaseResponse {
  /**
   * Array of staff member resources returned by the API.
   */
  staffMembers: StaffMemberResource[];
}
