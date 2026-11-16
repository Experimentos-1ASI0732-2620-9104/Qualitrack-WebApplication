import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { AlertDevice } from '../domain/model/alert-device.entity';
import { AlertDeviceResource } from './alert-device-response';
import { AlertDeviceAssembler } from './alert-device-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the devices where alerts originate.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/equipments` of Equipment Management and translates it with
 * {@link AlertDeviceAssembler}.
 */
export class AlertDeviceApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new AlertDeviceAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the equipment and devices of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getDevices(laboratoryId: number): Observable<AlertDevice[]> {
    return this.http
      .get<AlertDeviceResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.equipmentEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch the devices of laboratory ${laboratoryId}`)),
      );
  }
}
