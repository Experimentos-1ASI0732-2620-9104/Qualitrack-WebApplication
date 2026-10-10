import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { InventoryMovement } from '../domain/model/inventory-movement.entity';
import {
  InventoryMovementResource,
  InventoryMovementsResponse,
} from './inventory-movement-response';
import { InventoryMovementAssembler } from './inventory-movement-assembler';

/**
 * Base URL for laboratory-related API operations.
 *
 * @remarks
 * Combines the configured server base path with the
 * laboratory endpoint path to establish the base URL
 * used for inventory movement requests.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for retrieving raw material inventory movements.
 *
 * @remarks
 * This endpoint encapsulates HTTP communication for inventory
 * movements associated with raw materials stored in laboratory
 * environments.
 *
 * It extends {@link BaseApiEndpoint} to inherit common API
 * communication functionality and uses
 * {@link InventoryMovementAssembler} to convert infrastructure
 * resources into domain entities.
 *
 * The endpoint provides:
 * - GET laboratory environment raw material movements -
 *   Retrieve the movement history of a specific raw material.
 *
 * Inventory movements represent append-only records that
 * document inventory operations, including stock changes,
 * movement types, responsible actors, and occurrence dates.
 *
 * The endpoint delegates resource conversion to the assembler
 * and handles HTTP errors through the inherited error handler.
 */
export class InventoryMovementApiEndpoint extends BaseApiEndpoint<
  InventoryMovement,
  InventoryMovementResource,
  InventoryMovementsResponse,
  InventoryMovementAssembler
> {
  /**
   * Creates an instance of InventoryMovementApiEndpoint.
   *
   * @param http - Angular HttpClient used to perform HTTP requests.
   *
   * @remarks
   * Initializes the endpoint with the configured laboratory
   * API base URL and an instance of InventoryMovementAssembler.
   *
   * The assembler is responsible for converting inventory
   * movement resources received from the backend into
   * InventoryMovement domain entities.
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new InventoryMovementAssembler());
  }

  /**
   * Retrieves the inventory movement history of a raw material.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the raw material.
   * @returns An Observable emitting an array of InventoryMovement
   * domain entities retrieved from the backend.
   *
   * @remarks
   * Sends an HTTP GET request to the inventory movement
   * endpoint associated with the specified laboratory,
   * storage environment, and raw material.
   *
   * The request URL is constructed using the configured
   * API paths and the provided identifiers.
   *
   * The server response contains an array of
   * InventoryMovementResource objects, which are converted
   * into InventoryMovement domain entities using
   * the InventoryMovementAssembler.
   *
   * HTTP errors are processed through the inherited
   * handleError method with the message
   * "Failed to load inventory movements".
   *
   * This method retrieves the movement history without
   * modifying inventory records or calculating stock changes.
   */
  getByMaterial(lab: number, environmentId: number, material: number) {
    return this.http
      .get<InventoryMovementResource[]>(
        `${this.endpointUrl}/${lab}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialsEndpointPath}/${material}${environment.inventoryRawMaterialMovementsEndpointPath}`,
      )
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError('Failed to load inventory movements')),
      );
  }
}
