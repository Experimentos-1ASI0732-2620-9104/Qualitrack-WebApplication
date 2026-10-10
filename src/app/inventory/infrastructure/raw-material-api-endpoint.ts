import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterial, StockStatus } from '../domain/model/raw-material.entity';
import { RawMaterialResource, RawMaterialsResponse } from './raw-material-response';
import { RawMaterialAssembler } from './raw-material-assembler';
import { SaveRawMaterialRequest } from './raw-material.request';

/**
 * Base URL for laboratory-related API operations.
 *
 * @remarks
 * Combines the configured server base path with the
 * laboratory endpoint path to establish the base URL
 * used for raw material inventory requests.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for managing raw materials within
 * laboratory storage environments.
 *
 * @remarks
 * This endpoint encapsulates HTTP communication for raw materials
 * associated with laboratory environments (TS21, TS22, TS27).
 *
 * It extends {@link BaseApiEndpoint} to inherit common API
 * communication functionality and uses {@link RawMaterialAssembler}
 * to convert infrastructure resources into domain entities.
 *
 * The endpoint handles:
 * - GET /raw-materials - Retrieve raw materials from an environment.
 * - GET /raw-materials?stockStatus={status} - Filter materials by stock status.
 * - GET /raw-materials/{id} - Retrieve a specific raw material.
 * - POST /raw-materials - Register a new raw material.
 * - PUT /raw-materials/{id} - Update an existing raw material.
 *
 * These operations are scoped to the API path:
 * /laboratories/{laboratoryId}/environments/{environmentId}/raw-materials.
 *
 * Resource conversion is delegated to {@link RawMaterialAssembler},
 * while HTTP errors are processed through the inherited
 * error handling functionality.
 *
 * Stock quantities and classifications are supplied by the
 * backend rather than calculated by this endpoint.
 */
export class RawMaterialApiEndpoint extends BaseApiEndpoint<
  RawMaterial,
  RawMaterialResource,
  RawMaterialsResponse,
  RawMaterialAssembler
> {
  /**
   * Creates an instance of RawMaterialApiEndpoint.
   *
   * @param http - Angular HttpClient used to perform HTTP requests.
   *
   * @remarks
   * Initializes the endpoint with the configured laboratory
   * API base URL and an instance of {@link RawMaterialAssembler}.
   *
   * The assembler is responsible for converting between
   * {@link RawMaterial} domain entities and
   * {@link RawMaterialResource} infrastructure objects.
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new RawMaterialAssembler());
  }

  /**
   * Retrieves raw materials registered in a laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param stockStatus - Optional stock classification used to filter materials.
   * @returns An Observable emitting an array of RawMaterial domain entities.
   *
   * @remarks
   * Sends an HTTP GET request to retrieve the raw materials
   * associated with the specified laboratory and environment.
   *
   * When stockStatus is provided, the request includes
   * a query parameter to filter materials by their
   * stock classification.
   *
   * Supported classifications are LOW and SUFFICIENT,
   * as defined by {@link StockStatus}.
   *
   * The response contains an array of RawMaterialResource
   * objects, which are converted into domain entities
   * using {@link RawMaterialAssembler}.
   *
   * HTTP errors are processed through the inherited
   * handleError method with the message
   * "Failed to load inventory catalogue".
   */
  getByEnvironment(lab: number, environmentId: number, stockStatus?: StockStatus) {
    const params = stockStatus ? new HttpParams().set('stockStatus', stockStatus) : undefined;
    return this.http.get<RawMaterialResource[]>(this.collection(lab, environmentId), { params }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to load inventory catalogue')),
    );
  }

  /**
   * Retrieves a specific raw material from a laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param id - Unique identifier of the raw material.
   * @returns An Observable emitting the requested RawMaterial domain entity.
   *
   * @remarks
   * Sends an HTTP GET request to retrieve a raw material
   * identified by its ID within the specified environment.
   *
   * The request URL is constructed using the collection
   * endpoint and the raw material identifier.
   *
   * The returned {@link RawMaterialResource} is converted
   * into a {@link RawMaterial} domain entity through
   * the {@link RawMaterialAssembler}.
   *
   */
  getRawMaterial(lab: number, environmentId: number, id: number) {
    return this.http.get<RawMaterialResource>(`${this.collection(lab, environmentId)}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to load inventory material')),
    );
  }

  /**
   * Creates or updates a raw material within a laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param request - Raw material data following the SaveRawMaterialRequest contract.
   * @param id - Optional identifier of the raw material to update.
   * @returns An Observable emitting the saved RawMaterial domain entity.
   *
   * @remarks
   * Sends an HTTP request to save raw material information
   * within the specified laboratory environment.
   *
   * The operation depends on the provided identifier:
   * - POST /raw-materials - Creates a new raw material when
   *   no truthy identifier is provided.
   * - PUT /raw-materials/{id} - Updates an existing raw material
   *   when a truthy identifier is provided.
   *
   * The request body follows the {@link SaveRawMaterialRequest}
   * contract and includes material code, name, measurement
   * unit, and minimum stock threshold.
   *
   * The backend response is converted from a
   * {@link RawMaterialResource} into a {@link RawMaterial}
   * domain entity using {@link RawMaterialAssembler}.
   *
   */
  saveMaterial(lab: number, environmentId: number, request: SaveRawMaterialRequest, id?: number) {
    const url = this.collection(lab, environmentId);
    const response = id
      ? this.http.put<RawMaterialResource>(`${url}/${id}`, request)
      : this.http.post<RawMaterialResource>(url, request);
    return response.pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to save inventory material')),
    );
  }

  /**
   * Builds the API collection URL for raw materials
   * within a specific laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @returns The complete API URL for the raw material collection.
   *
   * @remarks
   * Combines the configured laboratory base URL,
   * environment endpoint path, environment identifier,
   * and raw material endpoint path.
   *
   * This private method centralizes URL construction
   * for raw material operations, avoiding duplication
   * across HTTP request methods.
   */
  private collection(lab: number, environmentId: number) {
    return `${this.endpointUrl}/${lab}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialsEndpointPath}`;
  }
}
