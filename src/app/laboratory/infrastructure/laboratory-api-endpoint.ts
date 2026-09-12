import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Laboratory } from '../domain/model/laboratory.entity';
import { LaboratoryResource, LaboratoriesResponse } from './laboratory-response';
import { LaboratoryAssembler } from './laboratory-assembler';
import { CreateLaboratoryRequest, UpdateLaboratoryRequest } from './laboratory.request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for laboratory profile operations.
 *
 * @remarks
 * This endpoint encapsulates HTTP communication for laboratory resources and
 * maps API resources into Laboratory domain entities.
 */
export class LaboratoryApiEndpoint extends BaseApiEndpoint<
  Laboratory,
  LaboratoryResource,
  LaboratoriesResponse,
  LaboratoryAssembler
> {
  /**
   * Creates a new LaboratoryApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to perform HTTP requests
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new LaboratoryAssembler());
  }

  /**
   * Creates a new laboratory.
   *
   * @param request - Request payload containing laboratory registration data
   * @returns Observable stream emitting the created Laboratory domain entity
   *
   * @remarks
   * Maps to `POST /laboratories`.
   */
  createLaboratory(request: CreateLaboratoryRequest): Observable<Laboratory> {
    return this.http.post<LaboratoryResource>(this.endpointUrl, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to create laboratory')),
    );
  }

  /**
   * Retrieves a laboratory by its numeric identifier.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting a Laboratory domain entity
   */
  getByLaboratoryId(laboratoryId: number): Observable<Laboratory> {
    return this.http.get<LaboratoryResource>(`${this.endpointUrl}/${laboratoryId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch laboratory ${laboratoryId}`)),
    );
  }

  /**
   * Updates mutable laboratory profile information.
   *
   * @param laboratoryId - Numeric identifier of the laboratory to update
   * @param request - Request payload containing updated laboratory data
   * @returns Observable stream emitting the updated Laboratory domain entity
   */
  updateLaboratory(laboratoryId: number, request: UpdateLaboratoryRequest): Observable<Laboratory> {
    return this.http.put<LaboratoryResource>(`${this.endpointUrl}/${laboratoryId}`, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to update laboratory ${laboratoryId}`)),
    );
  }
}
