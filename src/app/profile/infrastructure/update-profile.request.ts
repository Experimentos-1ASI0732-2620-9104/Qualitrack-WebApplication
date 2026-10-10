/**
 * Body of PUT /users/me/profile. Null optional values clear the field.
 *
 * @remarks
 * Data Transfer Object built by the {@link ProfileStore} from an {@link UpdateProfileCommand}; it only carries the
 * personal data the person can edit (the username, e-mail, roles and position come from other bounded contexts).
 */
export interface UpdateProfileRequest {
  /** New full name; it is required. */
  fullName: string;
  /** New national identity document (DNI), or null to clear it. */
  dni: string | null;
  /** New phone number, or null to clear it. */
  phoneNumber: string | null;
  /** New location, or null to clear it. */
  location: string | null;
}
