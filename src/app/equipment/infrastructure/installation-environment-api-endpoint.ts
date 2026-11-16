import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { InstallationEnvironment } from '../domain/model/installation-environment.entity';
import { InstallationEnvironmentResource } from './installation-environment-response';
import { InstallationEnvironmentAssembler } from './installation-environment-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the environments where equipment is installed.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/environments` of Laboratory Management and translates it with
 * {@link InstallationEnvironmentAssembler}.
 */
export class InstallationEnvironmentApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new InstallationEnvironmentAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the environments of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getEnvironments(laboratoryId: number): Observable<InstallationEnvironment[]> {
    return this.http
      .get<InstallationEnvironmentResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch the environments of laboratory ${laboratoryId}`)),
      );
  }
}
