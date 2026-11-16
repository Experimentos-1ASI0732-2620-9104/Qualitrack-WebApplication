/**
 * Command to register an Edge Gateway with the identifier it uses to authenticate in the cloud.
 *
 * @remarks
 * This command only carries the input data of the use case; it is not a domain entity.
 *
 * @example
 * ```typescript
 * const command: RegisterEdgeGatewayCommand = {
 *   name: 'Edge Gateway 1',
 *   sensorExternalId: 'EDGE-001',
 *   serialNumber: 'RPI-0001',
 *   model: 'Raspberry Pi 4'
 * };
 * ```
 */
export interface RegisterEdgeGatewayCommand {
  /**
   * The display name of the Edge Gateway.
   */
  name: string;

  /**
   * The unique identifier with which the Edge Gateway authenticates in the cloud.
   */
  sensorExternalId: string;

  /**
   * The serial number of the Edge Gateway.
   */
  serialNumber: string;

  /**
   * The model of the Edge Gateway.
   */
  model: string;
}
