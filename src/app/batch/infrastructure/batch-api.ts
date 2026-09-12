import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { Batch } from '../domain/model/batch.entity';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';

import { BatchApiEndpoint } from './batch-api-endpoint';
import { RawMaterialUsageApiEndpoint } from './raw-material-usage-api-endpoint';

import { CreateBatchRequest, ReleaseBatchRequest, RejectBatchRequest } from './batch.request';
import { LinkRawMaterialRequest } from './raw-material-usage.request';

/**
 * HTTP API facade for Batch and Raw Material Usage operations.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this service belongs to the
 * infrastructure layer and acts as a facade over HTTP endpoint clients.
 *
 * It exposes a clean API to the application layer while delegating concrete
 * HTTP communication and resource-to-entity transformation to specialized
 * endpoint classes.
 *
 * This facade coordinates:
 * - Batch lifecycle operations
 * - Raw material usage traceability operations
 *
 * @example
 * ```typescript
 * this.batchApi.getBatches(1).subscribe((batches) => {
 *   console.log(batches);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class BatchApi extends BaseApi {
  getMaterialHistory(rawMaterialId: number): Observable<RawMaterialUsage[]> {
    return this._usageEndpoint.getUsageByMaterial(rawMaterialId);
  }
  /**
   * Endpoint client responsible for batch lifecycle operations.
   */
  private readonly _batchEndpoint: BatchApiEndpoint;

  /**
   * Endpoint client responsible for raw material usage operations.
   */
  private readonly _usageEndpoint: RawMaterialUsageApiEndpoint;

  /**
   * Creates a new BatchApi facade.
   *
   * @param http - Angular HttpClient used by endpoint clients to perform HTTP requests
   */
  constructor(http: HttpClient) {
    super();
    this._batchEndpoint = new BatchApiEndpoint(http);
    this._usageEndpoint = new RawMaterialUsageApiEndpoint(http);
  }

  /**
   * Retrieves a single production batch by its numeric identifier.
   *
   * @param batchId - The unique numeric identifier of the batch
   * @returns Observable stream emitting the matching Batch domain entity
   */
  getBatchById(batchId: number): Observable<Batch> {
    return this._batchEndpoint.getBatchById(batchId);
  }

  /**
   * Retrieves all production batches associated with a laboratory.
   *
   * @param labId - The unique numeric identifier of the laboratory
   * @returns Observable stream emitting an array of Batch domain entities
   */
  getBatches(labId: number): Observable<Batch[]> {
    return this._batchEndpoint.getBatchesByLab(labId);
  }

  /**
   * Registers a new production batch.
   *
   * @param request - Request payload containing the batch creation data
   * @returns Observable stream emitting the created Batch domain entity
   */
  createBatch(request: CreateBatchRequest): Observable<Batch> {
    return this._batchEndpoint.createBatch(request);
  }

  /**
   * Releases a production batch after successful quality control.
   *
   * @param batchId - The unique numeric identifier of the batch to release
   * @param request - Request payload containing release date and quality notes
   * @returns Observable stream emitting the updated Batch domain entity
   */
  releaseBatch(batchId: number, request: ReleaseBatchRequest): Observable<Batch> {
    return this._batchEndpoint.releaseBatch(batchId, request);
  }

  /**
   * Rejects a production batch due to quality control or compliance failure.
   *
   * @param batchId - The unique numeric identifier of the batch to reject
   * @param request - Request payload containing rejection date and reason
   * @returns Observable stream emitting the updated Batch domain entity
   */
  rejectBatch(batchId: number, request: RejectBatchRequest): Observable<Batch> {
    return this._batchEndpoint.rejectBatch(batchId, request);
  }

  /**
   * Retrieves the raw material usage records associated with a batch.
   *
   * @param batchId - The unique numeric identifier of the batch
   * @returns Observable stream emitting an array of RawMaterialUsage domain entities
   */
  getRawMaterialUsage(batchId: number): Observable<RawMaterialUsage[]> {
    return this._usageEndpoint.getUsageByBatch(batchId);
  }

  /**
   * Links a raw material consumption record to a production batch.
   *
   * @param batchId - The unique numeric identifier of the batch
   * @param request - Request payload containing raw material and quantity data
   * @returns Observable stream emitting the created RawMaterialUsage domain entity
   */
  linkRawMaterial(batchId: number, request: LinkRawMaterialRequest): Observable<RawMaterialUsage> {
    return this._usageEndpoint.linkRawMaterial(batchId, request);
  }
}
