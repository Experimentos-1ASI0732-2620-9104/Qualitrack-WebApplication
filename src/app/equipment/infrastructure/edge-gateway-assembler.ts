import { EdgeGatewayApiKey } from '../domain/model/edge-gateway-api-key';
import { EdgeGatewayCoverage } from '../domain/model/edge-gateway-coverage.entity';
import { EdgeGatewayApiKeyResource, EdgeGatewayCoverageResource } from './edge-gateway-response';

/**
 * Assembler that converts the Edge Gateway resources of the API into the domain model.
 *
 * @remarks
 * It keeps the domain model independent from the structure of the HTTP responses.
 *
 * @example
 * ```typescript
 * const assembler = new EdgeGatewayAssembler();
 *
 * const coverage = assembler.toCoverageFromResource({
 *   maxDevicesPerGateway: 15,
 *   deviceCount: 3,
 *   uncoveredDeviceCount: 0,
 *   gateways: [{ equipmentId: 7, name: 'Edge Gateway 1', sensorExternalId: 'EDGE-001', deviceCount: 3 }]
 * });
 *
 * console.log(coverage.hasUncoveredDevices); // false
 * ```
 */
export class EdgeGatewayAssembler {
  /**
   * Converts a coverage resource into its domain entity.
   *
   * @remarks
   * A missing list of Edge Gateways is read as an empty list.
   *
   * @param resource - The coverage received from the API.
   * @returns The coverage of the environment.
   */
  toCoverageFromResource(resource: EdgeGatewayCoverageResource): EdgeGatewayCoverage {
    return new EdgeGatewayCoverage({
      maxDevicesPerGateway: resource.maxDevicesPerGateway,
      deviceCount: resource.deviceCount,
      uncoveredDeviceCount: resource.uncoveredDeviceCount,
      gateways: (resource.gateways ?? []).map((gateway) => ({
        equipmentId: gateway.equipmentId,
        name: gateway.name,
        sensorExternalId: gateway.sensorExternalId,
        deviceCount: gateway.deviceCount,
      })),
    });
  }

  /**
   * Converts an issued API key resource into its domain value.
   *
   * @param resource - The key received from the API.
   * @returns The identifier of the Edge Gateway and its API key.
   */
  toApiKeyFromResource(resource: EdgeGatewayApiKeyResource): EdgeGatewayApiKey {
    return { sensorExternalId: resource.sensorExternalId, apiKey: resource.apiKey };
  }
}
