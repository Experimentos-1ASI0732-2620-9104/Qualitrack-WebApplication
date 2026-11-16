import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { AlertEnvironment } from '../domain/model/alert-environment.entity';
import { AlertEnvironmentResource } from './alert-environment-response';
import { AlertEnvironmentAssembler } from './alert-environment-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the environments whose alerts are shown.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/environments` of Laboratory Management and translates it with
 * {@link AlertEnvironmentAssembler}.
 */
export class AlertEnvironmentApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new AlertEnvironmentAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the environments of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getEnvironments(laboratoryId: number): Observable<AlertEnvironment[]> {
    return this.http
      .get<AlertEnvironmentResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch the environments of laboratory ${laboratoryId}`)),
      );
  }
}
