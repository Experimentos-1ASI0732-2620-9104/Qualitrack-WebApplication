/**
 * Request payload for registering a staff member.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body sent to the backend when creating a staff member under a
 * laboratory. System-generated fields such as `id`, `active`, and `createdAt`
 * are intentionally excluded.
 */
export interface RegisterStaffRequest {
  /**
   * The numeric identifier of the laboratory where the staff member will be registered.
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
}
