import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a laboratory for API communication.
 *
 * @remarks
 * This interface belongs to the infrastructure layer and represents the
 * shape of laboratory data as returned by the backend API. It is converted
 * into a {@link Laboratory} domain entity by the corresponding assembler.
 */
export interface LaboratoryResource extends BaseResource {
  /**
   * The unique numeric identifier of the laboratory.
   */
  id: number;

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

  /**
   * The ISO 8601 timestamp indicating when the laboratory was created.
   */
  createdAt: string;

  /**
   * The ISO 8601 timestamp indicating when the laboratory was last updated.
   */
  updatedAt: string;
}

/**
 * Response envelope for laboratory collection queries.
 *
 * @remarks
 * This response is used when the backend returns multiple laboratory resources
 * inside a collection wrapper.
 */
export interface LaboratoriesResponse extends BaseResponse {
  /**
   * Array of laboratory resources returned by the API.
   */
  laboratories: LaboratoryResource[];
}
