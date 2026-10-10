import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { BpmConfigResource, BpmConfigsResponse } from './bpm-config-response';
import { BpmConfigAssembler } from './bpm-config-assembler';
import { ConfigureBpmRequest } from './bpm-config.request';

/** Base URL of the laboratories resource, built from the environment configuration. */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint for the BPM parameter ranges of an equipment.
 *
 * @remarks
 * It works over `/laboratories/{laboratoryId}/equipments/{equipmentId}/bpm-configs`. Each
 * parameter is identified by its name, so configuring it again replaces its range.
 *
 * @example
 * ```typescript
 * const endpoint = new BpmConfigApiEndpoint(http);
 *
 * endpoint.getConfigByEquipment(10, 101).subscribe((configs) => {
 *   console.log(configs.length);
 * });
 * ```
 */
export class BpmConfigApiEndpoint extends BaseApiEndpoint<
  BpmParameterConfig,
  BpmConfigResource,
  BpmConfigsResponse,
  BpmConfigAssembler
> {
  /**
   * Creates a new BPM configuration endpoint.
   *
   * @param http - The Angular HTTP client used to perform the requests.
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new BpmConfigAssembler());
  }

  /**
   * Retrieves the BPM parameter configurations of an equipment.
   *
   * @remarks
   * Performs a GET request and converts each resource into a domain entity.
   * Errors are handled through `handleError`.
   *
   * @param laboratoryId - The identifier of the laboratory that owns the equipment.
   * @param equipmentId - The identifier of the equipment.
   * @returns An observable that emits the list of BPM parameter configurations of the equipment.
   */
  getConfigByEquipment(laboratoryId: number, equipmentId: number): Observable<BpmParameterConfig[]> {
    return this.http
      .get<BpmConfigResource[]>(this.configsUrl(laboratoryId, equipmentId))
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError(`Failed to fetch BPM config for equipment ${equipmentId}`)),
      );
  }

  /**
   * Creates or replaces the range of a BPM parameter of an equipment.
   *
   * @remarks
   * Performs a PUT request to the URL of the parameter, identified by its name (URL-encoded).
   * The body only contains the range data (`minValue`, `maxValue` and `unit`); the equipment
   * and the parameter name travel in the URL.
   *
   * @param laboratoryId - The identifier of the laboratory that owns the equipment.
   * @param request - The BPM configuration to apply, including the equipment and parameter name.
   * @returns An observable that emits the resulting BPM parameter configuration.
   */
  configureBpm(laboratoryId: number, request: ConfigureBpmRequest): Observable<BpmParameterConfig> {
    const { equipmentId, parameterName, ...range } = request;
    return this.http
      .put<BpmConfigResource>(`${this.configsUrl(laboratoryId, equipmentId)}/${encodeURIComponent(parameterName)}`, range)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to configure BPM parameters')),
      );
  }

  /**
   * Builds the URL of the BPM configurations collection of an equipment.
   *
   * @param laboratoryId - The identifier of the laboratory that owns the equipment.
   * @param equipmentId - The identifier of the equipment.
   * @returns The URL of the BPM configurations of the equipment.
   */
  private configsUrl(laboratoryId: number, equipmentId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.equipmentEndpointPath}/${equipmentId}`
      + environment.equipmentBpmConfigEndpointPath;
  }
}
