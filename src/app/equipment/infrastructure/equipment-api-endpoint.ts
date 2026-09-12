import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Equipment } from '../domain/model/equipment.entity';
import { EquipmentResource, EquipmentsResponse } from './equipment-response';
import { EquipmentAssembler } from './equipment-assembler';
import { RegisterEquipmentRequest } from './equipment.request';

/**
 * The base endpoint URL used to access equipment-related API resources.
 *
 * @remarks
 * This URL is built using the server base path and the equipment endpoint path
 * defined in the application environment configuration.
 */
const equipmentEndpointUrl = `${environment.serverBasePath}${environment.equipmentEndpointPath}`;

/**
 * API endpoint responsible for equipment-related HTTP operations.
 *
 * @remarks
 * This class provides infrastructure-level operations for retrieving and
 * registering equipment in the system.
 *
 * It extends BaseApiEndpoint to reuse common HTTP behavior, endpoint
 * configuration, error handling, and transformation logic through an assembler.
 *
 * The endpoint communicates with the backend API using EquipmentResource and
 * EquipmentsResponse structures, while exposing Equipment domain entities to
 * the rest of the application.
 *
 * @example
 * ```typescript
 * const endpoint = new EquipmentApiEndpoint(httpClient);
 *
 * endpoint.getEquipmentByLab(101).subscribe((equipmentList) => {
 * console.log(equipmentList);
 * });
 *
 * endpoint.getEquipmentById(1).subscribe((equipment) => {
 * console.log(equipment);
 * });
 *
 * endpoint.registerEquipment({
 * laboratoryId: 101,
 * name: 'Centrifuge',
 * type: 'Laboratory Equipment',
 * model: 'CF-3000',
 * serialNumber: 'SN-2026-001'
 * }).subscribe((equipment) => {
 * console.log(equipment);
 * });
 * ```
 */
export class EquipmentApiEndpoint extends BaseApiEndpoint<
  Equipment,
  EquipmentResource,
  EquipmentsResponse,
  EquipmentAssembler
> {
  /**
   * Creates a new EquipmentApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to execute HTTP requests.
   *
   * @remarks
   * The constructor initializes the base API endpoint with the HTTP client,
   * the equipment endpoint URL, and an EquipmentAssembler instance.
   */
  constructor(http: HttpClient) {
    super(http, equipmentEndpointUrl, new EquipmentAssembler());
  }

  /**
   * Retrieves equipment registered in a specific laboratory.
   *
   * @param labId - The numeric identifier of the laboratory.
   * @returns An Observable containing a list of Equipment domain entities.
   *
   * @remarks
   * This method sends a GET request to retrieve all equipment associated with
   * the provided laboratory identifier.
   *
   * The API response is transformed into domain entities using the assembler.
   * If the request fails, the inherited handleError method manages the error.
   */
  getEquipmentByLab(labId: number): Observable<Equipment[]> {
    return this.http.get<EquipmentResource[]>(`${this.endpointUrl}?labId=${labId}`).pipe(
      map((resources) =>
        resources.map((resource) => this.assembler.toEntityFromResource(resource)),
      ),
      catchError(this.handleError(`Failed to fetch equipment for lab ${labId}`)),
    );
  }

  /**
   * Retrieves a specific equipment by its numeric identifier.
   *
   * @param equipmentId - The numeric identifier of the equipment.
   * @returns An Observable containing the Equipment domain entity.
   *
   * @remarks
   * This method sends a GET request to retrieve a single equipment resource
   * by its identifier.
   *
   * It is especially useful for direct navigation to the equipment detail view,
   * where the equipment list may not have been loaded previously.
   *
   * The API response is transformed into a domain entity using the assembler.
   * If the request fails, the inherited handleError method manages the error.
   */
  getEquipmentById(equipmentId: number): Observable<Equipment> {
    return this.http.get<EquipmentResource>(`${this.endpointUrl}/${equipmentId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch equipment ${equipmentId}`)),
    );
  }

  /**
   * Registers a new equipment in the system.
   *
   * @param request - The request data required to register the equipment.
   * @returns An Observable containing the registered Equipment domain entity.
   *
   * @remarks
   * This method sends a POST request with the equipment registration data.
   * The returned API resource is converted into an Equipment domain entity
   * using the assembler.
   *
   * If the registration request fails, the inherited handleError method
   * manages the error.
   */
  registerEquipment(request: RegisterEquipmentRequest): Observable<Equipment> {
    return this.http.post<EquipmentResource>(this.endpointUrl, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register equipment')),
    );
  }
}
