import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DeviceConnection, DeviceConnectionStatus } from '../domain/model/device-connection.entity';
import { DeviceConnectionResource, DeviceConnectionsResponse } from './device-connection-response';

/**
 * Assembler responsible for converting device connection data
 * between infrastructure resources and domain entities.
 *
 * This component isolates external API representations from the domain model,
 * ensuring that application logic works only with domain entities.
 *
 * It provides bidirectional transformation between:
 * - API response resources.
 * - DeviceConnection domain entities.
 */
export class DeviceConnectionAssembler implements BaseAssembler<
  DeviceConnection,
  DeviceConnectionResource,
  DeviceConnectionsResponse
> {
  /**
   * Converts a collection response from the API into domain entities.
   *
   * Each device connection resource is transformed into a DeviceConnection
   * entity to be consumed by the application layer.
   *
   * @param response External API response containing device connections.
   * @returns List of DeviceConnection domain entities.
   */
  toEntitiesFromResponse(response: DeviceConnectionsResponse): DeviceConnection[] {
    return response.devices.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an infrastructure resource into a domain entity.
   *
   * This transformation ensures that external data contracts remain isolated
   * from the domain model implementation.
   *
   * @param resource Device connection resource received from the API.
   * @returns DeviceConnection domain entity.
   */
  toEntityFromResource(resource: DeviceConnectionResource): DeviceConnection {
    return new DeviceConnection({
      id: resource.deviceId,
      connectionStatus: resource.connectionStatus as DeviceConnectionStatus,
      lastCommunicationAt: resource.lastCommunicationAt,
      expectedPeriodSeconds: resource.expectedPeriodSeconds,
    });
  }

  /**
   * Converts a domain entity into an infrastructure resource representation.
   *
   * Used when domain data needs to be serialized or transferred through
   * external communication layers.
   *
   * @param entity DeviceConnection domain entity.
   * @returns API-compatible device connection resource.
   */
  toResourceFromEntity(entity: DeviceConnection): DeviceConnectionResource {
    return {
      id: entity.id,
      deviceId: entity.id,
      connectionStatus: entity.connectionStatus,
      lastCommunicationAt: entity.lastCommunicationAt,
      expectedPeriodSeconds: entity.expectedPeriodSeconds,
    };
  }
}
