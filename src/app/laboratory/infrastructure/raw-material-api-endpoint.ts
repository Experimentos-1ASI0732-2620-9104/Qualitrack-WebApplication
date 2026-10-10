import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { RawMaterialResource, RawMaterialsResponse } from './raw-material-response';
import { RawMaterialAssembler } from './raw-material-assembler';

/**
 * Base URL of the laboratories resource, built from the environment configuration.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for raw material inventory operations.
 *
 * @remarks
 * This endpoint only lists the raw materials registered under a laboratory before
 * Inventory Management existed; registration now belongs to that bounded context.
 */
export class RawMaterialApiEndpoint extends BaseApiEndpoint<
  RawMaterial,
  RawMaterialResource,
  RawMaterialsResponse,
  RawMaterialAssembler
> {
  /**
   * Creates a new RawMaterialApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to perform HTTP requests
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new RawMaterialAssembler());
  }

  /**
   * Retrieves all raw materials registered under a laboratory.
   *
   * @remarks
   * Maps to `GET /laboratories/{laboratoryId}/raw-materials`.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting RawMaterial domain entities
   */
  getRawMaterialsByLaboratoryId(laboratoryId: number): Observable<RawMaterial[]> {
    return this.http
      .get<RawMaterialResource[]>(`${this.endpointUrl}/${laboratoryId}/raw-materials`)
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(
          this.handleError(`Failed to fetch raw materials for laboratory ${laboratoryId}`),
        ),
      );
  }

}
