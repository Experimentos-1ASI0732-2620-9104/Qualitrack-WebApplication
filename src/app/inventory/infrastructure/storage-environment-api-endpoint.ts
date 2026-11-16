import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { StorageEnvironment } from '../domain/model/storage-environment.entity';
import { StorageEnvironmentResource } from './storage-environment-response';
import { StorageEnvironmentAssembler } from './storage-environment-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the environments where raw materials are kept.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/environments` of Laboratory Management and translates it with
 * {@link StorageEnvironmentAssembler}.
 */
export class StorageEnvironmentApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new StorageEnvironmentAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the environments of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getEnvironments(laboratoryId: number): Observable<StorageEnvironment[]> {
    return this.http
      .get<StorageEnvironmentResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch the environments of laboratory ${laboratoryId}`)),
      );
  }

  /**
   * Reads one environment of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   * @param environmentId - The environment identifier
   */
  getEnvironment(laboratoryId: number, environmentId: number): Observable<StorageEnvironment> {
    return this.http
      .get<StorageEnvironmentResource>(
        `${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to fetch environment ${environmentId}`)),
      );
  }
}
