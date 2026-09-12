import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { TelemetryHistoryPoint } from '../domain/model/telemetry-history-point.entity';
import {
  TelemetryHistoryPointResource,
  TelemetryHistoryResponse,
} from './telemetry-history-response';
import { TelemetryHistoryAssembler } from './telemetry-history-assembler';

const equipmentsEndpointUrl = `${environment.serverBasePath}${environment.equipmentEndpointPath}`;

export class TelemetryHistoryApiEndpoint extends BaseApiEndpoint<
  TelemetryHistoryPoint,
  TelemetryHistoryPointResource,
  TelemetryHistoryResponse,
  TelemetryHistoryAssembler
> {
  constructor(http: HttpClient) {
    super(http, equipmentsEndpointUrl, new TelemetryHistoryAssembler());
  }

  getTelemetryHistory(filters: {
    equipmentId: number;
    from?: string;
    to?: string;
  }): Observable<TelemetryHistoryPoint[]> {
    let params = new HttpParams();

    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);

    return this.http
      .get<
        TelemetryHistoryResponse | TelemetryHistoryPointResource[]
      >(`${this.endpointUrl}/${filters.equipmentId}${environment.equipmentTelemetryHistoryEndpointPath}`, { params })
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response.map((resource) => this.assembler.toEntityFromResource(resource));
          }

          return this.assembler.toEntitiesFromResponse(response);
        }),
        catchError(
          this.handleError(
            `Failed to fetch telemetry history for equipment ${filters.equipmentId}`,
          ),
        ),
      );
  }
}
