/**
 * Request payload for registering a staff member.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body of `POST /laboratories/{laboratoryId}/staff`. The platform creates
 * the account of the staff member with the e-mail as username.
 */
export interface RegisterStaffRequest {
  /**
   * The full legal name of the staff member.
   */
  fullName: string;

  /**
   * The job title of the staff member in the laboratory.
   */
  role: string;

  /**
   * The corporate email address of the staff member.
   */
  email: string;

  /**
   * What the staff member can do with their account: `OPERATOR` or `AUDITOR`.
   */
  accessRole: string;
}
