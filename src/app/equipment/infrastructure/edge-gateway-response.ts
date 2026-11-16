/**
 * Edge Gateway of an environment as returned inside {@link EdgeGatewayCoverageResource}.
 */
export interface EdgeGatewayLoadResource {
  /** The equipment identifier of the Edge Gateway. */
  equipmentId: number;

  /** The display name of the Edge Gateway. */
  name: string;

  /** The identifier with which the Edge Gateway authenticates in the cloud. */
  sensorExternalId: string;

  /** The number of IoT devices of the environment this Edge Gateway serves. */
  deviceCount: number;
}

/**
 * Coverage returned by `GET .../environments/{environmentId}/edge-gateway-coverage`.
 *
 * @remarks
 * The `EdgeGatewayAssembler` converts it into the `EdgeGatewayCoverage` domain entity.
 *
 * @example
 * ```typescript
 * const resource: EdgeGatewayCoverageResource = {
 *   maxDevicesPerGateway: 15,
 *   deviceCount: 20,
 *   uncoveredDeviceCount: 5,
 *   gateways: [{ equipmentId: 7, name: 'Edge Gateway 1', sensorExternalId: 'EDGE-001', deviceCount: 15 }]
 * };
 * ```
 */
export interface EdgeGatewayCoverageResource {
  /** The number of IoT devices one Edge Gateway serves at most. */
  maxDevicesPerGateway: number;

  /** The number of IoT devices located in the environment. */
  deviceCount: number;

  /** The number of IoT devices of the environment that no Edge Gateway serves. */
  uncoveredDeviceCount: number;

  /** The Edge Gateways of the environment with the devices each one serves. */
  gateways: EdgeGatewayLoadResource[];
}

/**
 * Status returned by `GET /laboratories/{laboratoryId}/edge-gateways/{equipmentId}/api-key`.
 *
 * @remarks
 * It never carries the key: it only tells whether one was issued.
 */
export interface EdgeGatewayApiKeyStatusResource {
  /** Whether the Edge Gateway already has an API key. */
  issued: boolean;
}

/**
 * Key returned by `POST /laboratories/{laboratoryId}/edge-gateways/{equipmentId}/api-key`.
 *
 * @remarks
 * The cloud answers with the key only this once.
 */
export interface EdgeGatewayApiKeyResource {
  /** The identifier of the Edge Gateway. */
  sensorExternalId: string;

  /** The API key issued for the Edge Gateway. */
  apiKey: string;
}
