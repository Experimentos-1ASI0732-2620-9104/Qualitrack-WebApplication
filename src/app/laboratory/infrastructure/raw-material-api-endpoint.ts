import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { RawMaterialResource, RawMaterialsResponse } from './raw-material-response';
import { RawMaterialAssembler } from './raw-material-assembler';
import { CreateRawMaterialRequest } from './raw-material.request';
import { MessageResource } from '../../shared/infrastructure/message-response';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for raw material inventory operations.
 *
 * @remarks
 * This endpoint handles raw material listing, low-stock filtering, and creation
 * under a laboratory.
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

  /**
   * Retrieves raw materials whose stock is at or below the minimum threshold.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting low-stock RawMaterial domain entities
   */
  getLowStockMaterials(laboratoryId: number): Observable<RawMaterial[]> {
    const params = new HttpParams().set('lowStock', 'true');

    return this.http
      .get<RawMaterialResource[]>(`${this.endpointUrl}/${laboratoryId}/raw-materials`, { params })
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(
          this.handleError(
            `Failed to fetch low-stock raw materials for laboratory ${laboratoryId}`,
          ),
        ),
      );
  }

  /**
   * Creates a new raw material under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param request - Request payload containing raw material registration data
   * @returns Observable stream emitting a message response
   */
  createRawMaterial(
    laboratoryId: number,
    request: CreateRawMaterialRequest,
  ): Observable<MessageResource> {
    return this.http
      .post<MessageResource>(`${this.endpointUrl}/${laboratoryId}/raw-materials`, request)
      .pipe(catchError(this.handleError('Failed to create raw material')));
  }
}
