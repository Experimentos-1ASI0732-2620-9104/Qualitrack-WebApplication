import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { DeviceConnection } from '../domain/model/device-connection.entity';
import { DeviceConnectionResource, DeviceConnectionsResponse } from './device-connection-response';
import { DeviceConnectionAssembler } from './device-connection-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * Endpoint responsible for retrieving IoT device connectivity information.
 *
 * This infrastructure component communicates with the backend telemetry service
 * to obtain the current communication status of devices within an environment.
 *
 * The endpoint transforms API resources into DeviceConnection domain entities
 * using the DeviceConnectionAssembler.
 *
 * It provides connectivity information required by the monitoring module
 * to determine whether devices are available or require review.
 */
export class DeviceConnectionApiEndpoint extends BaseApiEndpoint<
  DeviceConnection,
  DeviceConnectionResource,
  DeviceConnectionsResponse,
  DeviceConnectionAssembler
> {
  /**
   * Initializes the device connection endpoint.
   *
   * Configures the base API URL and registers the assembler responsible
   * for converting external resources into domain entities.
   *
   * @param http Angular HTTP client used for backend communication.
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new DeviceConnectionAssembler());
  }

  /**
   * Retrieves the current connection status of an IoT device.
   *
   * The endpoint builds the required backend route using:
   * - Laboratory identifier.
   * - Environment identifier.
   * - Device identifier.
   *
   * The response is transformed from an API resource into a domain entity
   * before being exposed to the application layer.
   *
   * @param laboratoryId Identifier of the laboratory.
   * @param environmentId Identifier of the environment containing the device.
   * @param deviceId Identifier of the IoT device.
   *
   * @returns Observable containing the current device connection state.
   */
  getConnection(
    laboratoryId: number,
    environmentId: number,
    deviceId: number,
  ): Observable<DeviceConnection> {
    const url =
      `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}` +
      `${environment.devicesEndpointPath}/${deviceId}${environment.trackingTelemetryStatusEndpointPath}`;
    return this.http.get<DeviceConnectionResource>(url).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch the connection status of device ${deviceId}`)),
    );
  }
}
