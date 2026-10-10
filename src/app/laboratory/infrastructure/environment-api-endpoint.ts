import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Environment } from '../domain/model/environment.entity';
import { EnvironmentAssembler } from './environment-assembler';
import {
  EnvironmentResource,
  EnvironmentsResponse,
  EnvironmentUsageAssignmentResource,
} from './environment-response';
import {
  AssignEnvironmentUsageRequest,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
} from './environment.request';

/**
 * Base URL of the laboratories resource, built from the environment configuration.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for laboratory environment operations.
 *
 * @remarks
 * Maps to `/api/v1/laboratories/{laboratoryId}/environments` (TS15-TS18). Failed requests are
 * converted into errors by {@link BaseApiEndpoint.handleError}.
 */
export class EnvironmentApiEndpoint extends BaseApiEndpoint<
  Environment,
  EnvironmentResource,
  EnvironmentsResponse,
  EnvironmentAssembler
> {
  /**
   * Creates a new EnvironmentApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to perform HTTP requests
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new EnvironmentAssembler());
  }

  /**
   * Retrieves the environments registered in a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting Environment domain entities
   */
  getEnvironments(laboratoryId: number): Observable<Environment[]> {
    return this.http.get<EnvironmentResource[]>(this.collectionUrl(laboratoryId)).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError(`Failed to fetch environments for laboratory ${laboratoryId}`)),
    );
  }

  /**
   * Retrieves one environment of a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param environmentId - Numeric identifier of the environment
   * @returns Observable stream emitting the Environment domain entity
   */
  getEnvironment(laboratoryId: number, environmentId: number): Observable<Environment> {
    return this.http
      .get<EnvironmentResource>(`${this.collectionUrl(laboratoryId)}/${environmentId}`)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to fetch environment ${environmentId}`)),
      );
  }

  /**
   * Registers a new environment in a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param request - Request payload with the environment data
   * @returns Observable stream emitting the created Environment
   */
  createEnvironment(laboratoryId: number, request: CreateEnvironmentRequest): Observable<Environment> {
    return this.http.post<EnvironmentResource>(this.collectionUrl(laboratoryId), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register environment')),
    );
  }

  /**
   * Replaces the identification data of an environment.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param environmentId - Numeric identifier of the environment
   * @param request - Request payload with the new environment data
   * @returns Observable stream emitting the updated Environment
   */
  updateEnvironment(
    laboratoryId: number,
    environmentId: number,
    request: UpdateEnvironmentRequest,
  ): Observable<Environment> {
    return this.http
      .put<EnvironmentResource>(`${this.collectionUrl(laboratoryId)}/${environmentId}`, request)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to update environment ${environmentId}`)),
      );
  }

  /**
   * Assigns the main use of an environment.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param environmentId - Numeric identifier of the environment
   * @param request - Request payload with the usage
   * @returns Observable stream emitting the usage assignment resource
   */
  assignUsage(
    laboratoryId: number,
    environmentId: number,
    request: AssignEnvironmentUsageRequest,
  ): Observable<EnvironmentUsageAssignmentResource> {
    return this.http
      .post<EnvironmentUsageAssignmentResource>(
        `${this.collectionUrl(laboratoryId)}/${environmentId}${environment.laboratoryEnvironmentUsageAssignmentsEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError(`Failed to assign usage to environment ${environmentId}`)));
  }

  /**
   * Builds the URL of the environments collection of a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns URL of the environments collection
   */
  private collectionUrl(laboratoryId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}`;
  }
}
