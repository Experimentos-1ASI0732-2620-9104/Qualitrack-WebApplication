import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { StorageContainer } from '../domain/model/storage-container.entity';
import { StorageContainerResource } from './storage-container-response';
import { StorageContainerAssembler } from './storage-container-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the containers where raw material lots are stored.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/equipments` of Equipment Management and keeps, through
 * {@link StorageContainerAssembler}, the container monitors of one environment.
 */
export class StorageContainerApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new StorageContainerAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the containers of an environment.
   *
   * @param laboratoryId - The laboratory identifier
   * @param environmentId - The environment identifier
   */
  getContainers(laboratoryId: number, environmentId: number): Observable<StorageContainer[]> {
    return this.http
      .get<StorageContainerResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.equipmentEndpointPath}`)
      .pipe(
        map((resources) =>
          resources
            .filter((resource) => resource.deviceType === 'CONTAINER_MONITOR' && resource.environmentId === environmentId)
            .map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError(`Failed to fetch the containers of environment ${environmentId}`)),
      );
  }
}
