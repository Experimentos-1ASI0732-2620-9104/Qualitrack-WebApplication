
import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a legacy raw material
 * for API communication.
 *
 * @remarks
 * In Domain-Driven Design, LegacyMaterialResource is an
 * infrastructure-level resource contract that represents
 * a legacy raw material as received from the backend API.
 *
 * This resource contains material identification,
 * measurement unit, inventory balance, supplier information,
 * batch number, and expiration date.
 *
 * It serves as a data transfer structure between the
 * backend and frontend, without implementing domain logic.
 *
 * The resource can be transformed into a LegacyMaterial
 * domain model through the corresponding assembler.
 */
export interface LegacyMaterialResource extends BaseResource {
  /**
   * The unique identifier of the legacy raw material.
   */
  id: number;

  /**
   * The identification code assigned to the legacy material.
   *
   * @remarks
   * This code allows the material to be identified
   * and referenced within the inventory system.
   */
  code: string;

  /**
   * The descriptive name of the legacy raw material.
   */
  name: string;

  /**
   * The measurement unit used to quantify the material.
   *
   * @remarks
   * The unit is represented as a string according
   * to the legacy API resource contract.
   */
  unit: string;

  /**
   * The recorded inventory balance of the legacy material.
   *
   * @remarks
   * This value represents the material quantity
   * expressed in its corresponding measurement unit.
   */
  balance: number;

  /**
   * The name or identification of the supplier
   * associated with the legacy raw material.
   */
  supplier: string;

  /**
   * The batch or lot number associated
   * with the legacy raw material.
   *
   * @remarks
   * This value supports material identification
   * and traceability within inventory operations.
   */
  batchNumber: string;

  /**
   * The expiration date of the legacy raw material.
   *
   * @remarks
   * The date is represented as a string.
   * Its exact format depends on the API contract.
   */
  expiresOn: string;
}

/**
 * Request resource for importing a legacy raw material
 * into a storage environment.
 *
 * @remarks
 * ImportRawMaterialRequest defines the request body
 * required by the backend API to import an existing
 * legacy raw material into a specific environment.
 *
 * The request is sent through the POST endpoint:
 * /environments/{environmentId}/raw-material-imports.
 *
 * The environment identifier is provided through
 * the URL path, while the legacy material identifier
 * is included in the request body.
 *
 * This interface represents an infrastructure-level
 * request contract and does not implement the business
 * logic responsible for processing the import.
 */
export interface ImportRawMaterialRequest {
  /**
   * The unique identifier of the legacy raw material
   * to be imported into the selected environment.
   *
   * @remarks
   * This identifier references an existing legacy
   * material record that the backend will use
   * to process the import request.
   */
  legacyId: number;
}

