import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { AlertResource, AlertsResponse } from './alert-response';

/**
 * Assembler for converting between DeviationAlert domain entities and infrastructure resources.
 *
 * @remarks
 * In DDD, this assembler is responsible for transforming between:
 * - {@link DeviationAlert} - Domain entity with manufacturing/quality logic
 * - {@link AlertResource} - Infrastructure resource for API communication
 * - {@link AlertsResponse} - Response envelope from collection operations
 *
 * This ensures the domain layer remains decoupled from infrastructure concerns
 * like API response formats, field naming conventions, and serialization details.
 *
 * @example
 * ```typescript
 * const assembler = new AlertAssembler();
 *
 * // From API response to domain entities
 * const alerts = assembler.toEntitiesFromResponse(apiResponse);
 *
 * // From domain entity to API resource
 * const resource = assembler.toResourceFromEntity(deviationAlert);
 * ```
 */
export class AlertAssembler implements BaseAssembler<
  DeviationAlert,
  AlertResource,
  AlertsResponse
> {
  /**
   * Converts a collection response into an array of domain entities.
   *
   * @param response - The API response containing alert resources
   * @returns Array of DeviationAlert domain entities
   *
   * @remarks
   * Extracts the alerts array from the response envelope and converts
   * each resource into a domain DeviationAlert entity using the individual mapper.
   */
  toEntitiesFromResponse(response: AlertsResponse): DeviationAlert[] {
    return response.alerts.map((alert) => this.toEntityFromResource(alert));
  }

  /**
   * Converts an array of resources into an array of domain entities.
   *
   * @param resources - Array of alert resources
   * @returns Array of DeviationAlert domain entities
   */
  toEntitiesFromResources(resources: AlertResource[]): DeviationAlert[] {
    return resources.map((alert) => this.toEntityFromResource(alert));
  }

  /**
   * Converts an infrastructure resource into a domain entity.
   *
   * @param resource - The AlertResource to convert
   * @returns A new DeviationAlert domain entity
   *
   * @remarks
   * Maps resource properties directly to entity properties, ensuring the
   * returned entity is instantiated with the correct domain state.
   */
  toEntityFromResource(resource: AlertResource): DeviationAlert {
    return new DeviationAlert({
      id: resource.id,
      equipmentId: resource.equipmentId,
      batchId: resource.batchId,
      parameterName: resource.parameterName,
      recordedValue: resource.recordedValue,
      thresholdValue: resource.thresholdValue,
      unit: resource.unit,
      timestamp: resource.timestamp,
      severity: resource.severity,
      status: resource.status,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts a domain entity into an infrastructure resource.
   *
   * @param entity - The DeviationAlert domain entity to convert
   * @returns A new AlertResource suitable for API communication
   *
   * @remarks
   * Extracts the necessary data for API serialization, ensuring the infrastructure
   * layer receives a plain object (DTO) decoupled from domain logic.
   */
  toResourceFromEntity(entity: DeviationAlert): AlertResource {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      batchId: entity.batchId,
      parameterName: entity.parameterName,
      recordedValue: entity.recordedValue,
      thresholdValue: entity.thresholdValue,
      unit: entity.unit,
      timestamp: entity.timestamp,
      severity: entity.severity,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}
