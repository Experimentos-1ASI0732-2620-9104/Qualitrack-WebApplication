import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  map
} from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Batch } from '../domain/model/batch.entity';
import {
  BatchContainer,
  BatchTraceability
} from '../domain/model/batch-traceability.entity';
import {
  EquipmentUsage,
  StaffParticipation
} from '../domain/model/batch-participation.entity';
import {
  BatchContainerResource,
  BatchesResponse,
  BatchResource,
  BatchTraceabilityResource,
  EquipmentUsageResource,
  StaffParticipationResource
} from './batch-response';
import { BatchAssembler } from './batch-assembler';
import {
  AssignBatchContainerRequest,
  CreateBatchRequest,
  RegisterEquipmentUsageRequest,
  RegisterStaffParticipationRequest,
  RejectBatchRequest,
  ReleaseBatchRequest
} from './batch.request';

/**
 * Base URL of the laboratories resource.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * Path of a batch inside its laboratory, environment and product.
 *
 * @author Qualitrack
 */
export interface BatchPath {
  /**
   * The laboratory that owns the batch.
   */
  laboratoryId: number;

  /**
   * The environment where the product is manufactured.
   */
  environmentId: number;

  /**
   * The product the batch belongs to.
   */
  productId: number;
}

/**
 * HTTP client of the product batches of a laboratory.
 *
 * @remarks
 * Batches live under /laboratories/{laboratoryId}/environments/{environmentId}/products/{productId}/batches.
 * The laboratory-wide list comes from /laboratories/{laboratoryId}/batches.
 * Data transformation is delegated to {@link BatchAssembler}.
 *
 * @author Qualitrack
 */
export class BatchApiEndpoint extends BaseApiEndpoint<
  Batch,
  BatchResource,
  BatchesResponse,
  BatchAssembler
> {
  /**
   * Creates an instance of BatchApiEndpoint.
   *
   * @param http - Angular HttpClient for making HTTP requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      laboratoriesEndpointUrl,
      new BatchAssembler()
    );
  }

  /**
   * Retrieves the batches of every product of a laboratory.
   *
   * @param laboratoryId - The laboratory identifier.
   * @returns An Observable emitting the batches of the laboratory.
   */
  getLaboratoryBatches(laboratoryId: number): Observable<Batch[]> {
    return this.http
      .get<BatchResource[]>(
        `${this.endpointUrl}/${laboratoryId}${environment.productBatchesEndpointPath}`,
      )
      .pipe(
        map((resources) =>
          resources.map((resource) =>
            this.assembler.toEntityFromResource(resource)
          ),
        ),
        catchError(this.handleError(`Failed to fetch batches for laboratory ${laboratoryId}`)),
      );
  }

  /**
   * Retrieves the batches of a product.
   *
   * @param path - Laboratory, environment and product of the batches.
   * @returns An Observable emitting the batches of the product.
   */
  getProductBatches(path: BatchPath): Observable<Batch[]> {
    return this.http.get<BatchResource[]>(this.collection(path)).pipe(
      map((resources) =>
        resources.map((resource) =>
          this.assembler.toEntityFromResource(resource)
        ),
      ),
      catchError(this.handleError(`Failed to fetch batches of product ${path.productId}`)),
    );
  }

  /**
   * Retrieves a batch by its ID.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @returns An Observable emitting the batch.
   */
  getBatch(
    path: BatchPath,
    batchId: number
  ): Observable<Batch> {
    return this.http.get<BatchResource>(`${this.collection(path)}/${batchId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch batch ${batchId}`)),
    );
  }

  /**
   * Registers a manufacturing batch of a product.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param request - Number, quantity, unit, start date and optional notes of the batch.
   * @returns An Observable emitting the registered batch.
   */
  createBatch(
    path: BatchPath,
    request: CreateBatchRequest
  ): Observable<Batch> {
    return this.http.post<BatchResource>(this.collection(path), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register batch')),
    );
  }

  /**
   * Releases a batch with the signature of the authenticated user.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param request - Release date and notes.
   * @returns An Observable that emits once the batch is released; the response body is not mapped.
   */
  releaseBatch(
    path: BatchPath,
    batchId: number,
    request: ReleaseBatchRequest,
  ): Observable<unknown> {
    return this.http
      .post(`${this.collection(path)}/${batchId}${environment.batchReleasesEndpointPath}`, request)
      .pipe(catchError(this.handleError(`Failed to release batch ${batchId}`)));
  }

  /**
   * Rejects a batch with its reason.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param request - Rejection date and reason.
   * @returns An Observable that emits once the batch is rejected; the response body is not mapped.
   */
  rejectBatch(
    path: BatchPath,
    batchId: number,
    request: RejectBatchRequest
  ): Observable<unknown> {
    return this.http
      .post(
        `${this.collection(path)}/${batchId}${environment.batchRejectionsEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError(`Failed to reject batch ${batchId}`)));
  }

  /**
   * Registers the use of operational equipment in a batch.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param request - The equipment used.
   * @returns An Observable emitting the recorded usage.
   */
  registerEquipmentUsage(
    path: BatchPath,
    batchId: number,
    request: RegisterEquipmentUsageRequest,
  ): Observable<EquipmentUsage> {
    return this.http
      .post<EquipmentUsageResource>(
        `${this.collection(path)}/${batchId}${environment.batchEquipmentUsagesEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError('Failed to register equipment usage')));
  }

  /**
   * Registers the participation of a staff member in a batch.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param request - The staff member who takes part.
   * @returns An Observable emitting the recorded participation.
   */
  registerStaffParticipation(
    path: BatchPath,
    batchId: number,
    request: RegisterStaffParticipationRequest,
  ): Observable<StaffParticipation> {
    return this.http
      .post<StaffParticipationResource>(
        `${this.collection(path)}/${batchId}${environment.batchStaffParticipationsEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError('Failed to register staff participation')));
  }

  /**
   * Retrieves everything that took part in a batch.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @returns An Observable emitting the traceability of the batch.
   */
  getTraceability(
    path: BatchPath,
    batchId: number
  ): Observable<BatchTraceability> {
    return this.http
      .get<BatchTraceabilityResource>(
        `${this.collection(path)}/${batchId}${environment.batchTraceabilityEndpointPath}`,
      )
      .pipe(
        map((resource) => this.assembler.toTraceabilityFromResource(resource)),
        catchError(this.handleError(`Failed to fetch traceability of batch ${batchId}`)),
      );
  }

  /**
   * Stores the batch in a container monitor of a product storage environment.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param request - The container monitor where the batch is stored.
   * @returns An Observable emitting the container assignment.
   */
  assignContainer(
    path: BatchPath,
    batchId: number,
    request: AssignBatchContainerRequest,
  ): Observable<BatchContainer> {
    return this.http
      .put<BatchContainerResource>(
        `${this.collection(path)}/${batchId}${environment.batchContainerAssignmentEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError(`Failed to store batch ${batchId} in the container`)));
  }

  /**
   * Builds the URL of the batches collection of a product.
   *
   * @param path - Laboratory, environment and product of the batches.
   * @returns The URL of the collection.
   */
  private collection(path: BatchPath): string {
    return (
      `${this.endpointUrl}/${path.laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${path.environmentId}` +
      `${environment.productsEndpointPath}/${path.productId}${environment.productBatchesEndpointPath}`
    );
  }
}
