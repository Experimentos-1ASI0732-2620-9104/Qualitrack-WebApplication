/**
 * Profile as the platform sends it (GET /users/me/profile, GET .../staff/{staffId}/profile).
 *
 * @remarks
 * Infrastructure contract of the HTTP communication, without domain logic. The {@link ProfileAssembler} turns it
 * into a {@link Profile} entity.
 */
export interface ProfileResource {
  /** Numeric id of the account (IAM) the profile belongs to. */
  userId: number;
  /** Numeric id of the staff record in the laboratory, or null if the person is not staff. */
  staffId: number | null;
  /** Username of the account. */
  username: string;
  /** E-mail of the account, if any. */
  email: string | null;
  /** Roles of the account (e.g. `ROLE_QA_MANAGER`). */
  roles: string[];
  /** Full name, or null until the person completes the profile. */
  fullName: string | null;
  /** National identity document (DNI), if saved. */
  dni: string | null;
  /** Phone number, if saved. */
  phoneNumber: string | null;
  /** Location (city or site), if saved. */
  location: string | null;
  /** Position taken from the staff record of the laboratory, if any. */
  position: string | null;
  /** Whether the person uploaded a photo. */
  hasPhoto: boolean;
  /** ISO timestamp of the last photo change, or null if there is no photo. */
  photoUpdatedAt: string | null;
  /** ISO timestamp of the last change of the personal data, or null if never saved. */
  updatedAt: string | null;
}
