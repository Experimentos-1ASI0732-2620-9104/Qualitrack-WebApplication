import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Staff member returned by `/laboratories/{laboratoryId}/staff`.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and is converted into a
 * {@link StaffMember} domain entity by the staff assembler.
 */
export interface StaffMemberResource extends BaseResource {
  /**
   * The unique numeric identifier of the staff member.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory the staff member belongs to.
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
   * What the staff member can do; `null` for staff registered before accounts existed.
   */
  accessRole: 'OPERATOR' | 'AUDITOR' | null;

  /**
   * Account the staff member signs in with; `null` for staff registered before accounts existed.
   */
  userId: number | null;
}

/**
 * Response envelope for staff member collections.
 */
export interface StaffMembersResponse extends BaseResponse {
  /**
   * Array of staff member resources returned by the API.
   */
  staffMembers: StaffMemberResource[];
}

/**
 * Credentials of the account created for a staff member.
 */
export interface StaffCredentialsResource {
  /**
   * Username of the account, which is the e-mail of the staff member.
   */
  username: string;

  /**
   * `EMAIL` when the credentials were e-mailed; `SHOWN_ONCE` when the temporary
   * password is returned this single time.
   */
  delivery: 'EMAIL' | 'SHOWN_ONCE';

  /**
   * Temporary password; only present when `delivery` is `SHOWN_ONCE`.
   */
  temporaryPassword: string | null;
}

/**
 * Body of `201 Created` after registering a staff member.
 */
export interface RegisteredStaffResource {
  /**
   * The staff member that was registered.
   */
  staffMember: StaffMemberResource;

  /**
   * How the credentials of the new account were delivered.
   */
  credentials: StaffCredentialsResource;
}
