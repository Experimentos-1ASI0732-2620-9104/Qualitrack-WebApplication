/**
 * Edge Gateway of an environment with the number of IoT devices it serves.
 *
 * @example
 * ```typescript
 * const load: EdgeGatewayLoad = {
 *   equipmentId: 7,
 *   name: 'Edge Gateway 1',
 *   sensorExternalId: 'EDGE-001',
 *   deviceCount: 15
 * };
 * ```
 */
export interface EdgeGatewayLoad {
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
 * How the Edge Gateways of an environment cover its IoT devices.
 *
 * @remarks
 * The user only locates devices and Edge Gateways in an environment; the cloud works out which
 * Edge Gateway serves each device. Every Edge Gateway serves a limited number of devices, so the
 * devices left over when the Edge Gateways are full send no telemetry until another one is located.
 *
 * @example
 * ```typescript
 * const coverage = new EdgeGatewayCoverage({
 *   maxDevicesPerGateway: 15,
 *   deviceCount: 20,
 *   uncoveredDeviceCount: 5,
 *   gateways: [{ equipmentId: 7, name: 'Edge Gateway 1', sensorExternalId: 'EDGE-001', deviceCount: 15 }]
 * });
 *
 * console.log(coverage.hasUncoveredDevices); // true
 * ```
 */
export class EdgeGatewayCoverage {
  /** The number of IoT devices one Edge Gateway serves at most. */
  maxDevicesPerGateway: number;

  /** The number of IoT devices located in the environment. */
  deviceCount: number;

  /** The number of IoT devices of the environment that no Edge Gateway serves. */
  uncoveredDeviceCount: number;

  /** The Edge Gateways of the environment, in the order they receive devices. */
  gateways: EdgeGatewayLoad[];

  /**
   * Creates the coverage of an environment.
   *
   * @param params - Initialization properties for the coverage.
   * @param params.maxDevicesPerGateway - The number of IoT devices one Edge Gateway serves at most.
   * @param params.deviceCount - The number of IoT devices located in the environment.
   * @param params.uncoveredDeviceCount - The number of IoT devices that no Edge Gateway serves.
   * @param params.gateways - The Edge Gateways of the environment with the devices each one serves.
   */
  constructor(params: {
    maxDevicesPerGateway: number;
    deviceCount: number;
    uncoveredDeviceCount: number;
    gateways: EdgeGatewayLoad[];
  }) {
    this.maxDevicesPerGateway = params.maxDevicesPerGateway;
    this.deviceCount = params.deviceCount;
    this.uncoveredDeviceCount = params.uncoveredDeviceCount;
    this.gateways = params.gateways;
  }

  /**
   * Whether the environment has IoT devices that no Edge Gateway serves.
   *
   * @returns `true` if at least one device has no Edge Gateway; otherwise `false`.
   */
  get hasUncoveredDevices(): boolean {
    return this.uncoveredDeviceCount > 0;
  }
}
