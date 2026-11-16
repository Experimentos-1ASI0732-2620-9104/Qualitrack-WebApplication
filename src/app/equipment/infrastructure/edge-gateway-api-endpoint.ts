import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { Equipment } from '../domain/model/equipment.entity';
import { EdgeGatewayApiKey } from '../domain/model/edge-gateway-api-key';
import { EdgeGatewayCoverage } from '../domain/model/edge-gateway-coverage.entity';
import { EquipmentAssembler } from './equipment-assembler';
import { EquipmentResource } from './equipment-response';
import { EdgeGatewayAssembler } from './edge-gateway-assembler';
import {
  EdgeGatewayApiKeyResource,
  EdgeGatewayApiKeyStatusResource,
  EdgeGatewayCoverageResource,
} from './edge-gateway-response';
import { RegisterEdgeGatewayRequest } from './equipment.request';

/** Base URL of the laboratories resource, built from the environment configuration. */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint for the Edge Gateways of a laboratory.
 *
 * @remarks
 * An Edge Gateway is registered under `/laboratories/{laboratoryId}/edge-gateways` and answered as an
 * equipment. Its API key is issued once under the same resource, and the coverage of the IoT devices
 * of an environment is read under that environment.
 *
 * @example
 * ```typescript
 * const endpoint = new EdgeGatewayApiEndpoint(http);
 *
 * endpoint.getCoverage(10, 3).subscribe((coverage) => {
 *   console.log(coverage.uncoveredDeviceCount);
 * });
 * ```
 */
export class EdgeGatewayApiEndpoint extends ErrorHandlingEnabledBaseType {
  /** Assembler of the equipment answered when an Edge Gateway is registered. */
  private readonly equipmentAssembler = new EquipmentAssembler();

  /** Assembler of the coverage and of the issued API key. */
  private readonly assembler = new EdgeGatewayAssembler();

  /**
   * Creates a new Edge Gateway endpoint.
   *
   * @param http - The Angular HTTP client used to perform the requests.
   */
  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Registers an Edge Gateway in a laboratory.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param request - The data of the Edge Gateway to register.
   * @returns An observable that emits the registered Edge Gateway as an equipment.
   */
  registerEdgeGateway(laboratoryId: number, request: RegisterEdgeGatewayRequest): Observable<Equipment> {
    return this.http.post<EquipmentResource>(this.edgeGateways(laboratoryId), request).pipe(
      map((resource) => this.equipmentAssembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register Edge Gateway')),
    );
  }

  /**
   * Reads whether an Edge Gateway already has an API key.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param equipmentId - The equipment identifier of the Edge Gateway.
   * @returns An observable that emits `true` when a key was issued; otherwise `false`.
   */
  getApiKeyStatus(laboratoryId: number, equipmentId: number): Observable<boolean> {
    return this.http.get<EdgeGatewayApiKeyStatusResource>(this.apiKey(laboratoryId, equipmentId)).pipe(
      map((resource) => resource.issued),
      catchError(this.handleError(`Failed to fetch the API key status of Edge Gateway ${equipmentId}`)),
    );
  }

  /**
   * Issues the API key of an Edge Gateway.
   *
   * @remarks
   * The cloud answers with the key only this once. It rejects the request when the Edge Gateway is not
   * located in an environment, is not operational or already has a key.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param equipmentId - The equipment identifier of the Edge Gateway.
   * @returns An observable that emits the identifier of the Edge Gateway and its API key.
   */
  issueApiKey(laboratoryId: number, equipmentId: number): Observable<EdgeGatewayApiKey> {
    return this.http.post<EdgeGatewayApiKeyResource>(this.apiKey(laboratoryId, equipmentId), null).pipe(
      map((resource) => this.assembler.toApiKeyFromResource(resource)),
      catchError(this.handleError(`Failed to issue the API key of Edge Gateway ${equipmentId}`)),
    );
  }

  /**
   * Reads how the Edge Gateways of an environment cover its IoT devices.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment.
   * @returns An observable that emits the coverage of the environment.
   */
  getCoverage(laboratoryId: number, environmentId: number): Observable<EdgeGatewayCoverage> {
    const url = `${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.edgeGatewayCoverageEndpointPath}`;
    return this.http.get<EdgeGatewayCoverageResource>(url).pipe(
      map((resource) => this.assembler.toCoverageFromResource(resource)),
      catchError(this.handleError(`Failed to fetch the Edge Gateway coverage of environment ${environmentId}`)),
    );
  }

  /**
   * Builds the URL of the Edge Gateway collection of a laboratory.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @returns The URL of the Edge Gateways of the laboratory.
   */
  private edgeGateways(laboratoryId: number): string {
    return `${laboratoriesEndpointUrl}/${laboratoryId}${environment.edgeGatewaysEndpointPath}`;
  }

  /**
   * Builds the URL of the API key of an Edge Gateway.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param equipmentId - The equipment identifier of the Edge Gateway.
   * @returns The URL of the API key of the Edge Gateway.
   */
  private apiKey(laboratoryId: number, equipmentId: number): string {
    return `${this.edgeGateways(laboratoryId)}/${equipmentId}${environment.edgeGatewayApiKeyEndpointPath}`;
  }
}
