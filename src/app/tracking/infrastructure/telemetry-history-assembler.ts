import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { TelemetryHistoryPoint } from '../domain/model/telemetry-history-point.entity';
import {
  TelemetryHistoryPointResource,
  TelemetryHistoryResponse,
} from './telemetry-history-response';

/**
 * Assembler for converting between TelemetryHistoryPoint domain entities and API resources.
 *
 * @remarks
 * This assembler isolates the tracking domain model from the HTTP response
 * structure used by the backend telemetry API.
 */
export class TelemetryHistoryAssembler implements BaseAssembler<
  TelemetryHistoryPoint,
  TelemetryHistoryPointResource,
  TelemetryHistoryResponse
> {
  /**
   * Converts a telemetry history response envelope into domain entities.
   *
   * @param response - API response containing historical telemetry point resources
   * @returns Array of TelemetryHistoryPoint domain entities
   */
  toEntitiesFromResponse(response: TelemetryHistoryResponse): TelemetryHistoryPoint[] {
    return response.historyPoints.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a telemetry history point API resource into a domain entity.
   *
   * @param resource - Telemetry history point resource received from the API
   * @returns TelemetryHistoryPoint domain entity
   */
  toEntityFromResource(resource: TelemetryHistoryPointResource): TelemetryHistoryPoint {
    return new TelemetryHistoryPoint({
      id: resource.id,
      equipmentId: resource.equipmentId,
      parameterName: resource.parameterName,
      recordedValue: resource.recordedValue,
      timestamp: resource.timestamp,
      isAnomaly: resource.isAnomaly,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts a TelemetryHistoryPoint domain entity into an API resource.
   *
   * @param entity - TelemetryHistoryPoint domain entity
   * @returns TelemetryHistoryPoint resource ready for API communication
   */
  toResourceFromEntity(entity: TelemetryHistoryPoint): TelemetryHistoryPointResource {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      parameterName: entity.parameterName,
      recordedValue: entity.recordedValue,
      timestamp: entity.timestamp,
      isAnomaly: entity.isAnomaly,
      createdAt: entity.createdAt,
    };
  }
}
