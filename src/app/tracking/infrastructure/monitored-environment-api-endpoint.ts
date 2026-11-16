import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { MonitoredEnvironment } from '../domain/model/monitored-environment.entity';
import { MonitoredEnvironmentResource } from './monitored-environment-response';
import { MonitoredEnvironmentAssembler } from './monitored-environment-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the environments in which Tracking & Telemetry shows the readings.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/environments` of Laboratory Management.
 */
export class MonitoredEnvironmentApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new MonitoredEnvironmentAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the environments of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getEnvironments(laboratoryId: number): Observable<MonitoredEnvironment[]> {
    return this.http
      .get<MonitoredEnvironmentResource[]>(
        `${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}`,
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch the environments of laboratory ${laboratoryId}`)),
      );
  }
}
