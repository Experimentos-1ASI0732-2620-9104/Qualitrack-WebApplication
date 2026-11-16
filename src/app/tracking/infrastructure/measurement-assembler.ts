import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Measurement } from '../domain/model/measurement.entity';
import { EnvironmentalState, MonitoredMetric } from '../domain/model/monitored-metric';
import { MeasurementResource, MeasurementsResponse } from './tracking-response';

/**
 * Assembler responsible for converting telemetry measurement data
 * between API resources and domain entities.
 *
 * This mapper isolates external backend contracts from the domain layer,
 * ensuring that application logic works with strongly typed domain models.
 *
 * It handles both directions:
 * - API response resources into Measurement entities.
 * - Domain entities into API-compatible resources.
 */
export class MeasurementAssembler implements BaseAssembler<
  Measurement,
  MeasurementResource,
  MeasurementsResponse
> {
  /**
   * Converts a collection response of measurement resources
   * into domain entities.
   *
   * @param response Backend response containing telemetry measurements.
   * @returns Collection of Measurement domain entities.
   */
  toEntitiesFromResponse(response: MeasurementsResponse): Measurement[] {
    return response.measurements.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a measurement API resource into a domain entity.
   *
   * This transformation maps external API values into domain types,
   * including metric and environmental state representations.
   *
   * @param resource Measurement data received from the backend.
   * @returns Measurement domain entity.
   */
  toEntityFromResource(resource: MeasurementResource): Measurement {
    return new Measurement({
      id: resource.id,
      deviceId: resource.deviceId,
      environmentId: resource.environmentId,
      metric: resource.metric as MonitoredMetric,
      value: resource.value,
      textValue: resource.textValue,
      unit: resource.unit,
      measuredAt: resource.measuredAt,
      state: resource.state as EnvironmentalState | null,
      thresholdValue: resource.thresholdValue,
      profileVersion: resource.profileVersion,
    });
  }

  /**
   * Converts a Measurement domain entity into an API resource.
   *
   * Used when domain information needs to be transferred
   * through infrastructure communication layers.
   *
   * @param entity Measurement domain entity.
   * @returns API-compatible measurement resource.
   */
  toResourceFromEntity(entity: Measurement): MeasurementResource {
    return { ...entity, state: entity.state };
  }
}
