import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { IndicatorPeriod } from '../domain/model/indicator-period';
import { DeviationTrendResource, DeviationTrendsResponse } from './deviation-trend-response';
import { DeviationTrendAssembler } from './deviation-trend-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the deviation indicators of an environment (TS82).
 */
export class DeviationTrendApiEndpoint extends BaseApiEndpoint<
  DeviationTrend,
  DeviationTrendResource,
  DeviationTrendsResponse,
  DeviationTrendAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new DeviationTrendAssembler());
  }

  getTrendsByEnvironment(laboratoryId: number, environmentId: number, period: IndicatorPeriod): Observable<DeviationTrend[]> {
    const params = new HttpParams().set('from', period.from).set('to', period.to);
    return this.http
      .get<DeviationTrendResource[]>(
        `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`
          + environment.raDeviationTrendsEndpointPath, { params })
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResources(resources)),
        catchError(this.handleError(`Failed to fetch deviation trends for environment ${environmentId}`)),
      );
  }
}
