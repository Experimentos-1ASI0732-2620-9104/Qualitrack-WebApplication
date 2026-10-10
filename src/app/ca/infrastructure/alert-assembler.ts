import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { AlertDetailResource, AlertResource, AlertsResponse } from './alert-response';

/**
 * Converts deviation alerts between the resources of the API and {@link DeviationAlert} entities.
 *
 * @remarks
 * The list of alerts and the alert detail share most fields. Only the detail ({@link AlertDetailResource}) carries
 * the actions related to the incident, so the entities built from a list have no related actuations.
 *
 * @example
 * ```typescript
 * const assembler = new AlertAssembler();
 * const alerts = assembler.toEntitiesFromResources(resources);
 * ```
 */
export class AlertAssembler implements BaseAssembler<
  DeviationAlert,
  AlertResource,
  AlertsResponse
> {
  /**
   * Converts a response envelope into entities.
   *
   * @param response - The envelope with the alert resources
   * @returns The deviation alerts, in the order they were received
   */
  toEntitiesFromResponse(response: AlertsResponse): DeviationAlert[] {
    return response.alerts.map((alert) => this.toEntityFromResource(alert));
  }

  /**
   * Converts a list of alert resources into entities.
   *
   * @param resources - The alerts as the API sends them
   * @returns The deviation alerts, in the order they were received
   */
  toEntitiesFromResources(resources: AlertResource[]): DeviationAlert[] {
    return resources.map((alert) => this.toEntityFromResource(alert));
  }

  /**
   * Converts an alert resource, from the list or from the detail, into an entity.
   *
   * @param resource - The alert as the API sends it
   * @returns The deviation alert; its related actuations are empty unless the resource is an alert detail
   */
  toEntityFromResource(resource: AlertResource | AlertDetailResource): DeviationAlert {
    return new DeviationAlert({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      environmentId: resource.environmentId,
      origin: resource.origin,
      equipmentId: resource.equipmentId,
      batchId: resource.batchId,
      measurementId: resource.measurementId,
      lastMeasurementId: resource.lastMeasurementId,
      parameterName: resource.parameterName,
      recordedValue: resource.recordedValue,
      thresholdValue: resource.thresholdValue,
      unit: resource.unit,
      timestamp: resource.timestamp,
      severity: resource.severity,
      status: resource.status,
      deviationCount: resource.deviationCount,
      lastDetectedAt: resource.lastDetectedAt,
      normalizedAt: resource.normalizedAt,
      acknowledgedBy: resource.acknowledgedBy,
      acknowledgedAt: resource.acknowledgedAt,
      resolvedBy: resource.resolvedBy,
      resolvedAt: resource.resolvedAt,
      resolutionNotes: resource.resolutionNotes,
      relatedActuations: 'relatedActuations' in resource ? resource.relatedActuations : [],
    });
  }

  /**
   * Converts an alert into the resource of the list.
   *
   * @param entity - The deviation alert
   * @returns The alert resource, without the related actuations of the detail
   */
  toResourceFromEntity(entity: DeviationAlert): AlertResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      environmentId: entity.environmentId,
      origin: entity.origin,
      equipmentId: entity.equipmentId,
      batchId: entity.batchId,
      measurementId: entity.measurementId,
      lastMeasurementId: entity.lastMeasurementId,
      parameterName: entity.parameterName,
      recordedValue: entity.recordedValue,
      thresholdValue: entity.thresholdValue,
      unit: entity.unit,
      timestamp: entity.timestamp,
      severity: entity.severity,
      status: entity.status,
      deviationCount: entity.deviationCount,
      lastDetectedAt: entity.lastDetectedAt,
      normalizedAt: entity.normalizedAt,
      acknowledgedBy: entity.acknowledgedBy,
      acknowledgedAt: entity.acknowledgedAt,
      resolvedBy: entity.resolvedBy,
      resolvedAt: entity.resolvedAt,
      resolutionNotes: entity.resolutionNotes,
    };
  }
}
