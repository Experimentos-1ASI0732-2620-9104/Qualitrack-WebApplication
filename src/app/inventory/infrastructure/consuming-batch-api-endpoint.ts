import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { ConsumingBatch } from '../domain/model/consuming-batch.entity';
import { ConsumingBatchResource } from './consuming-batch-response';
import { ConsumingBatchAssembler } from './consuming-batch-assembler';

/** Reads the laboratory-scoped resource used by historical material details, through an Inventory ACL. */
export class ConsumingBatchApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new ConsumingBatchAssembler();
  constructor(private readonly http: HttpClient) { super(); }

  getByLaboratory(laboratoryId: number): Observable<ConsumingBatch[]> {
    const url = environment.serverBasePath + environment.laboratoryLabsEndpointPath + '/' + laboratoryId + environment.productBatchesEndpointPath;
    return this.http.get<ConsumingBatchResource[]>(url).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch historical material references')),
    );
  }
}
