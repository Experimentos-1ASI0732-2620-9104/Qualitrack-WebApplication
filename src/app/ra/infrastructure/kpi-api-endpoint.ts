import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { KpiDashboard } from '../domain/model/kpi-dashboard.entity';
import { KpiDashboardResource, KpiDashboardsResponse } from './kpi-response';
import { KpiAssembler } from './kpi-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

export class KpiApiEndpoint extends BaseApiEndpoint<
  KpiDashboard,
  KpiDashboardResource,
  KpiDashboardsResponse,
  KpiAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new KpiAssembler());
  }

  getDashboardByLaboratory(laboratoryId: number): Observable<KpiDashboard> {
    return this.http
      .get<KpiDashboardResource>(
        `${this.endpointUrl}/${laboratoryId}${environment.raKpiDashboardsEndpointPath}`,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(
          this.handleError(`Failed to fetch KPI dashboard for laboratory ${laboratoryId}`),
        ),
      );
  }
}
