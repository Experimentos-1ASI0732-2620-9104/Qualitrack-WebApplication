import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { ProductionEnvironment } from '../domain/model/production-environment.entity';
import { ProductionEnvironmentResource } from './production-environment-response';
import { ProductionEnvironmentAssembler } from './production-environment-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the environments where products are made and stored.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/environments` of Laboratory Management and translates it with
 * {@link ProductionEnvironmentAssembler}.
 */
export class ProductionEnvironmentApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new ProductionEnvironmentAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the environments of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getEnvironments(laboratoryId: number): Observable<ProductionEnvironment[]> {
    return this.http
      .get<ProductionEnvironmentResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch the environments of laboratory ${laboratoryId}`)),
      );
  }
}
