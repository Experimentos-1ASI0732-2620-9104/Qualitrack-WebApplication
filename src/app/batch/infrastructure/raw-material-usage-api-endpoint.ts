import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  map
} from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';
import {
  RawMaterialUsageResource,
  RawMaterialUsagesResponse
} from './raw-material-usage-response';
import { RawMaterialUsageAssembler } from './raw-material-usage-assembler';
import { RegisterRawMaterialUsageRequest } from './raw-material-usage.request';
import { BatchPath } from './batch-api-endpoint';

/**
 * Base URL of the laboratories resource.
 */
const usageEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

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
 * - POST .../products/{productId}/batches/{batchId}/raw-material-usages - Consume a raw material lot.
 * - GET .../environments/{environmentId}/raw-materials/{rawMaterialId}/usages - Batches that used a material.
 * - GET /laboratories/{laboratoryId}/raw-materials/{legacyRawMaterialId}/usages - History of a pre-Inventory raw material.
 *
 * Data transformation is delegated to {@link RawMaterialUsageAssembler}, ensuring the
 * application layer remains decoupled from API-specific resource shapes.
 *
 * @example
 * ```typescript
 * const endpoint = new RawMaterialUsageApiEndpoint(http);
 *
 * // Batches that consumed lots of an Inventory raw material
 * endpoint.getUsageByEnvironmentMaterial(1, 3, 45).subscribe(usages => console.log(usages));
 * ```
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
    super(
      http,
      usageEndpointUrl,
      new RawMaterialUsageAssembler()
    );
  }

  /**
   * Retrieves the product batches that consumed lots of an Inventory raw material.
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment where the raw material is kept.
   * @param rawMaterialId - The Inventory raw material identifier.
   * @returns An Observable emitting the usages, newest first.
   */
  getUsageByEnvironmentMaterial(
    laboratoryId: number,
    environmentId: number,
    rawMaterialId: number,
  ): Observable<RawMaterialUsage[]> {
    return this.http
      .get<RawMaterialUsageResource[]>(
        `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialsEndpointPath}/${rawMaterialId}${environment.inventoryRawMaterialUsagesEndpointPath}`,
      )
      .pipe(
        map((resources) =>
          resources.map((resource) =>
            this.assembler.toEntityFromResource(resource)
          ),
        ),
        catchError(this.handleError(`Failed to fetch usages of raw material ${rawMaterialId}`)),
      );
  }

  /**
   * Retrieves the batches that used a raw material registered before Inventory Management existed.
   *
   * @param laboratoryId - The laboratory of the material.
   * @param rawMaterialId - The legacy raw material identifier.
   * @returns An Observable emitting the usages of the material.
   */
  getUsageByMaterial(
    laboratoryId: number,
    rawMaterialId: number
  ): Observable<RawMaterialUsage[]> {
    return this.http
      .get<RawMaterialUsageResource[]>(
        `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}/${laboratoryId}` +
          `${environment.laboratoryRawMaterialsEndpointPath}/${rawMaterialId}${environment.inventoryRawMaterialUsagesEndpointPath}`
      )
      .pipe(
        map((resources) =>
          resources.map((resource) =>
            this.assembler.toEntityFromResource(resource)
          ),
        ),
      );
  }

  /**
   * Consumes a released raw material lot for a product batch and returns the recorded usage.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The product batch.
   * @param request - Lot, amount, unit and idempotency key.
   * @returns An Observable emitting the recorded usage.
   *
   * @remarks
   * The operation id of the request makes the call idempotent: a retry with the same id returns the
   * original usage instead of consuming the lot twice.
   */
  registerUsage(
    path: BatchPath,
    batchId: number,
    request: RegisterRawMaterialUsageRequest,
  ): Observable<RawMaterialUsage> {
    return this.http
      .post<RawMaterialUsageResource>(
        `${this.endpointUrl}/${path.laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${path.environmentId}` +
          `${environment.productsEndpointPath}/${path.productId}${environment.productBatchesEndpointPath}/${batchId}` +
          environment.batchRawMaterialUsagesEndpointPath,
        request,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to register raw material usage for batch ${batchId}`)),
      );
  }
}
