import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Batch } from '../domain/model/batch.entity';
import { BatchResource, BatchesResponse } from './batch-response';
import { BatchAssembler } from './batch-assembler';
import { CreateBatchRequest, ReleaseBatchRequest, RejectBatchRequest } from './batch.request';

const batchEndpointUrl = `${environment.serverBasePath}${environment.batchEndpointPath}`;

export class BatchApiEndpoint extends BaseApiEndpoint<
  Batch,
  BatchResource,
  BatchesResponse,
  BatchAssembler
> {
  constructor(http: HttpClient) {
    super(http, batchEndpointUrl, new BatchAssembler());
  }

  getBatchById(batchId: number): Observable<Batch> {
    return this.http.get<BatchResource>(`${this.endpointUrl}/${batchId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch batch ${batchId}`)),
    );
  }

  getBatchesByLab(labId: number): Observable<Batch[]> {
    return this.http.get<BatchResource[]>(`${this.endpointUrl}?labId=${labId}`).pipe(
      map((resources) =>
        resources.map((resource) => this.assembler.toEntityFromResource(resource)),
      ),
      catchError(this.handleError(`Failed to fetch batches for lab ${labId}`)),
    );
  }

  createBatch(request: CreateBatchRequest): Observable<Batch> {
    return this.http.post<BatchResource>(this.endpointUrl, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to create batch')),
    );
  }

  releaseBatch(batchId: number, request: ReleaseBatchRequest): Observable<Batch> {
    return this.http.patch<BatchResource>(`${this.endpointUrl}/${batchId}`, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to release batch ${batchId}`)),
    );
  }

  rejectBatch(batchId: number, request: RejectBatchRequest): Observable<Batch> {
    return this.http.patch<BatchResource>(`${this.endpointUrl}/${batchId}`, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to reject batch ${batchId}`)),
    );
  }
}
