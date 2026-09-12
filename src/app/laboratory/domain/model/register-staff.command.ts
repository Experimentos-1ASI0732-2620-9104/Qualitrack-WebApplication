/**
 * Command for registering a new staff member.
 *
 * @remarks
 * In CQRS, this command represents the user's intent to create a staff member
 * under a specific laboratory. It carries only the data required by the
 * registration use case.
 */
export interface RegisterStaffCommand {
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
