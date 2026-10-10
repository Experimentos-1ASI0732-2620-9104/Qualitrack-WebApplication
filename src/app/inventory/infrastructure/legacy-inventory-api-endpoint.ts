import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { LegacyMaterial } from '../domain/model/legacy-material.entity';
import { ImportRawMaterialRequest, LegacyMaterialResource } from './legacy-inventory-response';
import { RawMaterialResource } from './raw-material-response';

/**
 * Base URL for laboratory-related API operations.
 *
 * @remarks
 * Combines the configured server base path with the
 * laboratory endpoint path to establish the base URL
 * used for legacy inventory requests.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for accessing and importing legacy inventory materials.
 *
 * @remarks
 * This endpoint encapsulates HTTP communication related to
 * legacy raw material records within the inventory bounded context.
 *
 * It provides access to a read-only snapshot of the previous
 * inventory and supports transferring existing material records
 * into a specific laboratory storage environment.
 *
 * The endpoint handles:
 * - GET legacy materials - Retrieve previous inventory balances
 *   associated with a laboratory.
 * - POST raw material imports - Import a selected legacy material
 *   into a specified storage environment.
 *
 * It extends {@link ErrorHandlingEnabledBaseType} to reuse
 * centralized HTTP error handling functionality.
 *
 * Legacy inventory records are not managed as a second writable
 * catalogue. The endpoint only retrieves existing records
 * and requests their import into the current inventory system.
 *
 * API resources are converted into {@link LegacyMaterial}
 * objects when retrieving legacy materials.
 */
export class LegacyInventoryApiEndpoint extends ErrorHandlingEnabledBaseType {
  /**
   * Creates an instance of LegacyInventoryApiEndpoint.
   *
   * @param http - Angular HttpClient used to perform HTTP requests.
   *
   * @remarks
   * Initializes the endpoint with an injected HttpClient
   * instance for communicating with the backend API.
   *
   * The endpoint inherits HTTP error handling functionality
   * from {@link ErrorHandlingEnabledBaseType}.
   */
  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Retrieves the legacy raw materials associated with a laboratory.
   *
   * @param lab - Unique identifier of the laboratory.
   * @returns An Observable emitting an array of LegacyMaterial
   * objects retrieved from the backend.
   *
   * @remarks
   * Sends an HTTP GET request to retrieve the legacy inventory
   * records associated with the specified laboratory.
   *
   * The server returns an array of {@link LegacyMaterialResource}
   * objects containing material identification, measurement units,
   * previous balances, supplier information, batch numbers,
   * and expiration dates.
   *
   * Each resource is mapped directly into a {@link LegacyMaterial}
   * object without modifying the values supplied by the backend.
   *
   * HTTP errors are processed through the inherited
   * handleError method with the message
   * "Failed to load previous balances".
   *
   * This method performs a read-only operation and does not
   * modify or import legacy inventory records.
   */
  pending(lab: number) {
    return this.http
      .get<LegacyMaterialResource[]>(
        `${laboratoriesEndpointUrl}/${lab}${environment.inventoryEndpointPath}${environment.inventoryLegacyMaterialsEndpointPath}`,
      )
      .pipe(
        map((resources) =>
          resources.map((resource): LegacyMaterial => ({
            id: resource.id,
            code: resource.code,
            name: resource.name,
            unit: resource.unit,
            balance: resource.balance,
            supplier: resource.supplier,
            batchNumber: resource.batchNumber,
            expiresOn: resource.expiresOn,
          })),
        ),
        catchError(this.handleError('Failed to load previous balances')),
      );
  }

  /**
   * Imports a legacy raw material into a laboratory storage environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the destination storage environment.
   * @param legacyId - Unique identifier of the legacy material to import.
   * @returns An Observable emitting the RawMaterialResource
   * returned by the backend after processing the import request.
   *
   * @remarks
   * Sends an HTTP POST request to import an existing legacy
   * raw material into the specified laboratory environment.
   *
   * The request body follows the {@link ImportRawMaterialRequest}
   * structure and contains the identifier of the legacy material.
   *
   * The backend processes the import request and returns
   * a {@link RawMaterialResource} representing the resulting
   * raw material record in the current inventory system.
   *
   * The endpoint delegates import validation and processing
   * to the backend without implementing business rules locally.
   *
   * HTTP errors are processed through the inherited
   * handleError method with the message
   * "Failed to import previous balance".
   */
  importMaterial(lab: number, environmentId: number, legacyId: number) {
    const request: ImportRawMaterialRequest = { legacyId };
    return this.http
      .post<RawMaterialResource>(
        `${laboratoriesEndpointUrl}/${lab}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialImportsEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError('Failed to import previous balance')));
  }
}
