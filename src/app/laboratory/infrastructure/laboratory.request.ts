/**
 * Request payload for creating a laboratory.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body sent to the backend when registering a new laboratory.
 * It excludes system-generated fields such as `id`, `createdAt`, and `updatedAt`.
 */
export interface CreateLaboratoryRequest {
  /**
   * The official registered name of the laboratory.
   */
  name: string;

  /**
   * The tax identification number of the laboratory.
   */
  ruc: string;

  /**
   * The physical address of the laboratory.
   */
  address: string;

  /**
   * The contact phone number of the laboratory.
   */
  phone: string;

  /**
   * The regulatory frameworks or standards applicable to this laboratory.
   */
  applicableRegulations: string[];
}

/**
 * Request payload for updating a laboratory profile.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the HTTP
 * request body sent to the backend when updating mutable laboratory information.
 * It excludes immutable fields such as `id`, `ruc`, `createdAt`, and `updatedAt`.
 */
export interface UpdateLaboratoryRequest {
  /**
   * The updated official registered name of the laboratory.
   */
  name: string;

  /**
   * The updated physical address of the laboratory.
   */
  address: string;

  /**
   * The updated contact phone number of the laboratory.
   */
  phone: string;

  /**
   * The updated regulatory frameworks or standards applicable to the laboratory.
   */
  applicableRegulations: string[];
}
