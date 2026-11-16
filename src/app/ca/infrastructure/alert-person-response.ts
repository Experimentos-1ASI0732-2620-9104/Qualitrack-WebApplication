/**
 * Staff member returned by `GET /laboratories/{laboratoryId}/staff`, with the fields Compliance & Alerts reads.
 */
export interface AlertStaffResource {
  fullName: string;
  /** Account of the staff member; null for staff registered before accounts existed. */
  userId: number | null;
}

/**
 * User returned by `GET /users`, with the fields Compliance & Alerts reads.
 */
export interface AlertUserResource {
  id: number;
  username: string;
}

/**
 * Profile returned by `GET /users/me/profile`, with the fields Compliance & Alerts reads.
 */
export interface AlertOwnProfileResource {
  userId: number;
  fullName: string | null;
}
