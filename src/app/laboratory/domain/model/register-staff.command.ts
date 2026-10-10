import { StaffAccessRole, StaffMember } from './staff-member.entity';

/**
 * Command for registering a new staff member, who receives an account to sign in.
 *
 * @remarks
 * In CQRS, this command represents the quality manager's intent to create a staff member
 * under their laboratory. The e-mail becomes the username of the account.
 */
export interface RegisterStaffCommand {
  /**
   * The full legal name of the staff member.
   */
  fullName: string;

  /**
   * The job title of the staff member in the laboratory.
   */
  role: string;

  /**
   * The corporate email address; the credentials are sent to it.
   */
  email: string;

  /**
   * What the staff member can do with their account.
   */
  accessRole: StaffAccessRole;
}

/**
 * How the staff member receives the credentials of their account: by e-mail, or shown once to
 * the quality manager when they could not be e-mailed.
 */
export interface StaffCredentials {
  /**
   * Username of the account, which is the e-mail of the staff member.
   */
  username: string;

  /**
   * How the credentials were delivered.
   *
   * @remarks
   * `EMAIL` when they were sent to the staff member; `SHOWN_ONCE` when the platform
   * could not e-mail them and returns the temporary password this single time.
   */
  delivery: 'EMAIL' | 'SHOWN_ONCE';

  /**
   * Temporary password to hand over; only present when `delivery` is `SHOWN_ONCE`.
   */
  temporaryPassword: string | null;
}

/**
 * Staff member registered with the delivery of their credentials.
 *
 * @remarks
 * Result of handling a {@link RegisterStaffCommand}.
 */
export interface RegisteredStaff {
  /**
   * The staff member that was registered.
   */
  staffMember: StaffMember;

  /**
   * How the staff member receives the credentials of the new account.
   */
  credentials: StaffCredentials;
}
