import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { MonitoredDevice } from '../domain/model/monitored-device.entity';
import { MonitoredDeviceResource } from './monitored-device-response';
import { MonitoredDeviceAssembler } from './monitored-device-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the IoT devices that Tracking & Telemetry follows.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/equipments` of Equipment Management and keeps, through
 * {@link MonitoredDeviceAssembler}, the IoT devices of one environment of the laboratory.
 */
export class MonitoredDeviceApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new MonitoredDeviceAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the IoT devices located in an environment.
   *
   * @param laboratoryId - The laboratory identifier
   * @param environmentId - The environment identifier
   */
  getDevices(laboratoryId: number, environmentId: number): Observable<MonitoredDevice[]> {
    return this.http
      .get<MonitoredDeviceResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.equipmentEndpointPath}`)
      .pipe(
        map((resources) =>
          resources
            .filter(
              (resource) =>
                this.assembler.isMonitored(resource) &&
                resource.laboratoryId === laboratoryId &&
                resource.environmentId === environmentId,
            )
            .map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError(`Failed to fetch the devices of environment ${environmentId}`)),
      );
  }
}
