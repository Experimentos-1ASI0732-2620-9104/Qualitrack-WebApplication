import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';
import { RawMaterialUsageResource, RawMaterialUsagesResponse } from './raw-material-usage-response';
import { RawMaterialUsageAssembler } from './raw-material-usage-assembler';
import { LinkRawMaterialRequest } from './raw-material-usage.request';

const usageEndpointUrl = `${environment.serverBasePath}${environment.batchEndpointPath}`;
/**
 * HTTP endpoint client for raw material usage and traceability operations.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this endpoint encapsulates all HTTP
 * communication related to the consumption and linking of raw materials within the
 * manufacturing bounded context. It extends {@link BaseApiEndpoint} to inherit
 * standard infrastructure behaviors for API interaction.
 *
 * The endpoint handles:
 * - GET /usage/:batchId/materials - Retrieve all materials consumed by a specific batch.
 * - POST /usage/:batchId/materials - Record the link/usage of a material within a batch.
 *
 * Data transformation is delegated to {@link RawMaterialUsageAssembler}, ensuring the
 * application layer remains decoupled from API-specific resource shapes.
 *
 * @author Qualitrack
 */
export class RawMaterialUsageApiEndpoint extends BaseApiEndpoint<
  RawMaterialUsage,
  RawMaterialUsageResource,
  RawMaterialUsagesResponse,
  RawMaterialUsageAssembler
> {
  /**
   * Creates an instance of RawMaterialUsageApiEndpoint.
   *
   * @param http - Angular HttpClient for making HTTP requests.
   *
   * @remarks
   * Initializes the endpoint with the specific URL for material usage and
   * the assembler required to convert between domain entities and infrastructure resources.
   */
  constructor(http: HttpClient) {
    super(http, usageEndpointUrl, new RawMaterialUsageAssembler());
  }

  /**
   * Retrieves the collection of raw material usage records for a specific production batch.
   *
   * @param batchId - The unique numeric identifier of the batch.
   * @returns An Observable emitting an array of RawMaterialUsage domain entities.
   *
   * @remarks
   * Performs an HTTP GET request to fetch the traceability data. The response envelope
   * is automatically mapped into domain entities via the assembler.
   */
  getUsageByMaterial(rawMaterialId: number): Observable<RawMaterialUsage[]> {
    return this.http.get<RawMaterialUsageResource[]>(`${environment.serverBasePath}/raw-materials/${rawMaterialId}/usages`)
      .pipe(map(resources => resources.map(resource => this.assembler.toEntityFromResource(resource))));
  }

  getUsageByBatch(batchId: number): Observable<RawMaterialUsage[]> {
    return this.http
      .get<RawMaterialUsageResource[]>(`${this.endpointUrl}/${batchId}/raw-materials`)
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError(`Failed to fetch raw material usage for batch ${batchId}`)),
      );
  }

  /**
   * Records the usage of a specific raw material and links it to a production batch.
   *
   * @param batchId - The numeric identifier of the batch consuming the material.
   * @param request - The payload containing material ID and quantity used.
   * @returns An Observable emitting the resulting RawMaterialUsage domain entity.
   *
   * @remarks
   * Performs an HTTP POST request to establish the genealogical link between
   * the batch and the raw material, critical for quality control and compliance.
   */
  linkRawMaterial(batchId: number, request: LinkRawMaterialRequest): Observable<RawMaterialUsage> {
    return this.http
      .post<RawMaterialUsageResource>(`${this.endpointUrl}/${batchId}/raw-materials`, request)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),

      );
  }
}
