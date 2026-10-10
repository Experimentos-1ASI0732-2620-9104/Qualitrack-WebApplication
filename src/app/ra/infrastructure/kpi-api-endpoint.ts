import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { KpiDashboard } from '../domain/model/kpi-dashboard.entity';
import { KpiDashboardResource, KpiDashboardsResponse } from './kpi-response';
import { KpiAssembler } from './kpi-assembler';
import { IndicatorPeriod } from '../domain/model/indicator-period';

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

  /** Indicators of the laboratory for a period, of every environment or of one (US93, TS81). */
  getDashboardByLaboratory(laboratoryId: number, period?: IndicatorPeriod, environmentId?: number | null): Observable<KpiDashboard> {
    let params = new HttpParams();
    if (period) params = params.set('from', period.from).set('to', period.to);
    if (environmentId) params = params.set('environmentId', environmentId);
    return this.http
      .get<KpiDashboardResource>(
        `${this.endpointUrl}/${laboratoryId}${environment.raKpiDashboardsEndpointPath}`, { params },
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(
          this.handleError(`Failed to fetch KPI dashboard for laboratory ${laboratoryId}`),
        ),
      );
  }
}
