import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { DeviationTrendResource, DeviationTrendsResponse } from './deviation-trend-response';
import { DeviationTrendAssembler } from './deviation-trend-assembler';

const equipmentsEndpointUrl = `${environment.serverBasePath}${environment.equipmentEndpointPath}`;

export class DeviationTrendApiEndpoint extends BaseApiEndpoint<
  DeviationTrend,
  DeviationTrendResource,
  DeviationTrendsResponse,
  DeviationTrendAssembler
> {
  constructor(http: HttpClient) {
    super(http, equipmentsEndpointUrl, new DeviationTrendAssembler());
  }

  getTrendsByEquipment(equipmentId: number): Observable<DeviationTrend[]> {
    return this.http
      .get<
        DeviationTrendResource[]
      >(`${this.endpointUrl}/${equipmentId}${environment.equipmentDeviationTrendsEndpointPath}`)
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResources(resources)),
        catchError(
          this.handleError(`Failed to fetch deviation trends for equipment ${equipmentId}`),
        ),
      );
  }
}
