/**
 * Command to replace the personal data of the profile of the signed-in user. Empty optional values clear the field.
 *
 * @remarks
 * It holds the raw values of the form; the {@link ProfileStore} trims them and turns blank optional values into null
 * before sending them as an {@link UpdateProfileRequest}.
 */
export interface UpdateProfileCommand {
  /** Full name; it is required. */
  fullName: string;
  /** National identity document (DNI); empty to clear it. */
  dni: string;
  /** Phone number; empty to clear it. */
  phoneNumber: string;
  /** Location; empty to clear it. */
  location: string;
}
