import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Measurement } from '../domain/model/measurement.entity';
import { MeasurementResource, MeasurementsResponse } from './measurement-response';
import { MeasurementAssembler } from './measurement-assembler';

const equipmentsEndpointUrl = `${environment.serverBasePath}${environment.equipmentEndpointPath}`;

export class MeasurementApiEndpoint extends BaseApiEndpoint<
  Measurement,
  MeasurementResource,
  MeasurementsResponse,
  MeasurementAssembler
> {
  constructor(http: HttpClient) {
    super(http, equipmentsEndpointUrl, new MeasurementAssembler());
  }

  getLatestMeasurements(equipmentId: number): Observable<Measurement[]> {
    return this.http
      .get<
        MeasurementsResponse | MeasurementResource[]
      >(`${this.endpointUrl}/${equipmentId}${environment.equipmentTelemetryMeasurementsEndpointPath}`)
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response.map((resource) => this.assembler.toEntityFromResource(resource));
          }

          return this.assembler.toEntitiesFromResponse(response);
        }),
        catchError(
          this.handleError(`Failed to fetch telemetry measurements for equipment ${equipmentId}`),
        ),
      );
  }
}
