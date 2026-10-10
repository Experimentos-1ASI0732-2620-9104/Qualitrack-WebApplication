import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { ExpirationStatus, RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import {
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
  RawMaterialBatchReviewResource,
  RawMaterialBatchContainerResource,
} from './raw-material-batch-response';
import { RawMaterialBatchAssembler } from './raw-material-batch-assembler';
import {
  AssignRawMaterialBatchContainerRequest,
  ReceiveRawMaterialBatchRequest,
  ReviewRawMaterialBatchRequest,
} from './raw-material-batch.request';

/**
 * Base URL for laboratory-related API operations.
 *
 * @remarks
 * Combines the configured server base path with the
 * laboratory endpoint path to establish the base URL
 * used for raw material batch requests.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for managing raw material batches
 * within laboratory storage environments.
 *
 * @remarks
 * This endpoint encapsulates HTTP communication for raw material
 * batches associated with laboratory environments
 *
 * It extends {@link BaseApiEndpoint} to inherit common API
 * communication functionality and uses {@link RawMaterialBatchAssembler}
 * to convert infrastructure resources into domain entities.
 *
 * The endpoint handles:
 * - GET raw material batches - Retrieve batches associated
 *   with a specific raw material, optionally filtered by usability.
 * - GET environment raw material batches - Retrieve batches
 *   from an environment, optionally filtered by expiration criteria.
 * - POST raw material batches - Register the receipt of a new batch.
 * - POST batch reviews - Register a review of an existing batch.
 * - PUT container assignment - Assign or replace the container
 *   monitor associated with a raw material batch.
 *
 */
export class RawMaterialBatchApiEndpoint extends BaseApiEndpoint<
  RawMaterialBatch,
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
  RawMaterialBatchAssembler
> {
  /**
   * Creates an instance of RawMaterialBatchApiEndpoint.
   *
   * @param http - Angular HttpClient used to perform HTTP requests.
   *
   * @remarks
   * Initializes the endpoint with the configured laboratory
   * API base URL and an instance of {@link RawMaterialBatchAssembler}.
   *
   * The assembler converts between {@link RawMaterialBatch}
   * domain entities and {@link RawMaterialBatchResource}
   * infrastructure resources.
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new RawMaterialBatchAssembler());
  }

  /**
   * Retrieves the raw material batches associated with a specific material.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the raw material.
   * @param usable - Optional flag to request only usable batches.
   * @returns An Observable emitting an array of RawMaterialBatch domain entities.
   *
   * @remarks
   * Sends an HTTP GET request to retrieve the batches
   * associated with the specified raw material.
   *
   * When usable is true, the request includes the
   * query parameter usable=true.
   *
   * When usable is false or undefined, the query parameter
   * is omitted and no usability filter is requested.
   *
   * The returned {@link RawMaterialBatchResource} objects
   * are converted into {@link RawMaterialBatch} domain
   * entities using {@link RawMaterialBatchAssembler}.
   *
   */
  getByMaterial(lab: number, environmentId: number, material: number, usable?: boolean) {
    const params = usable ? new HttpParams().set('usable', true) : undefined;
    return this.http.get<RawMaterialBatchResource[]>(this.batches(lab, environmentId, material), { params }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to load supplier receipts')),
    );
  }

  /**
   * Retrieves raw material batches registered in a laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param expirationStatus - Optional expiration classification used to filter batches.
   * @param withinDays - Optional number of days used as an expiration filter.
   * @returns An Observable emitting an array of RawMaterialBatch domain entities.
   *
   * @remarks
   * Sends an HTTP GET request to retrieve raw material
   * batches associated with the specified environment.
   *
   * The request supports optional query parameters:
   * - expirationStatus: Filters batches using a supported
   *   {@link ExpirationStatus} value.
   * - withinDays: Specifies a number of days used by
   *   the backend for expiration-based filtering.
   *
   * The expirationStatus parameter supports VALID,
   * NEAR_EXPIRY, and EXPIRED classifications.
   *
   * When withinDays is defined, it is included in the
   * request even if its value is zero.
   *
   * The returned resources are converted into
   * {@link RawMaterialBatch} domain entities using
   * {@link RawMaterialBatchAssembler}.
   *
   */
  getByEnvironment(lab: number, environmentId: number, expirationStatus?: ExpirationStatus, withinDays?: number) {
    let params = new HttpParams();
    if (expirationStatus) params = params.set('expirationStatus', expirationStatus);
    if (withinDays !== undefined) params = params.set('withinDays', withinDays);
    return this.http
      .get<RawMaterialBatchResource[]>(
        `${this.environmentRoot(lab, environmentId)}${environment.inventoryEnvironmentRawMaterialBatchesEndpointPath}`,
        { params },
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError('Failed to load raw material lots')),
      );
  }

  /**
   * Registers the receipt of a new raw material batch.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the associated raw material.
   * @param request - Batch receipt data following the ReceiveRawMaterialBatchRequest contract.
   * @returns An Observable emitting the registered RawMaterialBatch domain entity.
   *
   * @remarks
   * Sends an HTTP POST request to register a new batch
   * associated with the specified raw material.
   *
   * The request body follows the {@link ReceiveRawMaterialBatchRequest}
   * contract and contains supplier information, batch number,
   * measurement unit, received quantity, receipt date,
   * and expiration date.
   *
   * The backend processes the receipt and returns a
   * {@link RawMaterialBatchResource}, which is converted
   * into a {@link RawMaterialBatch} domain entity.
   *
   */
  receive(lab: number, environmentId: number, material: number, request: ReceiveRawMaterialBatchRequest) {
    return this.http.post<RawMaterialBatchResource>(this.batches(lab, environmentId, material), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register receipt')),
    );
  }

  /**
   * Registers a review of an existing raw material batch.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the associated raw material.
   * @param batch - Unique identifier of the batch to review.
   * @param request - Review data following the ReviewRawMaterialBatchRequest contract.
   * @returns An Observable emitting the RawMaterialBatchReviewResource
   * returned by the backend.
   *
   * @remarks
   * Sends an HTTP POST request to register a review
   * for the specified raw material batch.
   *
   * The request body follows the {@link ReviewRawMaterialBatchRequest}
   * contract and includes the resulting batch status
   * and the reason for the review.
   *
   * The backend returns a {@link RawMaterialBatchReviewResource}
   * containing the previous and resulting statuses,
   * review justification, responsible actor, and timestamp.
   *
   */
  review(lab: number, environmentId: number, material: number, batch: number, request: ReviewRawMaterialBatchRequest) {
    return this.http
      .post<RawMaterialBatchReviewResource>(
        `${this.batches(lab, environmentId, material)}/${batch}${environment.inventoryRawMaterialBatchReviewsEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError('Failed to review receipt')));
  }

  /**
   * Assigns a container monitor to a raw material batch.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the associated raw material.
   * @param batch - Unique identifier of the batch to assign.
   * @param request - Container assignment data following the AssignRawMaterialBatchContainerRequest contract.
   * @returns An Observable emitting the RawMaterialBatchContainerResource
   * returned by the backend.
   *
   * @remarks
   * Sends an HTTP PUT request to associate the specified
   * raw material batch with a container monitor (TS29).
   *
   * The request body follows the
   * {@link AssignRawMaterialBatchContainerRequest} contract
   * and contains the identifier of the container monitor.
   *
   * The operation requests the replacement of any existing
   * container monitor assignment with the new one.
   *
   * The backend returns a {@link RawMaterialBatchContainerResource}
   * containing the batch identifier, assigned monitor,
   * container information, responsible actor, and timestamp.
   *
   */
  assignContainer(lab: number, environmentId: number, material: number, batch: number,
                  request: AssignRawMaterialBatchContainerRequest) {
    return this.http
      .put<RawMaterialBatchContainerResource>(
        `${this.batches(lab, environmentId, material)}/${batch}${environment.inventoryRawMaterialBatchContainerAssignmentEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError('Failed to store the lot in the container')));
  }

  /**
   * Builds the API root URL for a laboratory storage environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @returns The complete API root URL for the specified environment.
   *
   * @remarks
   * Combines the laboratory endpoint URL with the
   * laboratory identifier, environment endpoint path,
   * and environment identifier.
   *
   * This private method centralizes environment URL
   * construction for batch-related API operations.
   */
  private environmentRoot(lab: number, environmentId: number) {
    return `${this.endpointUrl}/${lab}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`;
  }

  /**
   * Builds the API collection URL for batches of a raw material.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the raw material.
   * @returns The complete API URL for the raw material batch collection.
   *
   * @remarks
   * Extends the environment root URL with the raw material
   * endpoint path, material identifier, and batch endpoint path.
   *
   * This private method centralizes URL construction
   * for retrieving, receiving, reviewing, and assigning
   * containers to raw material batches.
   */
  private batches(lab: number, environmentId: number, material: number) {
    return `${this.environmentRoot(lab, environmentId)}${environment.inventoryRawMaterialsEndpointPath}/${material}${environment.inventoryRawMaterialBatchesEndpointPath}`;
  }

}
