import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Measurement } from '../domain/model/measurement.entity';
import { ActuationAction, ActuationEvent } from '../domain/model/actuation-event.entity';
import { ActuationRule, EnvironmentalProfile, EnvironmentalThreshold } from '../domain/model/environmental-profile.entity';
import { EnvironmentalState, MonitoredMetric } from '../domain/model/monitored-metric';
import {
  ActuationEventResource,
  ActuationEventsResponse,
  EnvironmentalProfileResource,
  EnvironmentalProfilesResponse,
  MeasurementResource,
  MeasurementsResponse,
} from './tracking-response';

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

/**
 * Assembler responsible for converting actuation event information
 * between API resources and domain entities.
 *
 * It maintains the separation between external event representations
 * and the internal domain model used for IoT device actions.
 */
export class ActuationEventAssembler implements BaseAssembler<
  ActuationEvent,
  ActuationEventResource,
  ActuationEventsResponse
> {
  /**
   * Converts multiple actuation event resources into domain entities.
   *
   * @param response Backend response containing actuation events.
   * @returns Collection of ActuationEvent entities.
   */
  toEntitiesFromResponse(response: ActuationEventsResponse): ActuationEvent[] {
    return response.actuationEvents.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an actuation event resource into a domain entity.
   *
   * Handles transformation of action, trigger condition and execution
   * status values into domain-compatible representations.
   *
   * @param resource Actuation event received from the backend.
   * @returns ActuationEvent domain entity.
   */
  toEntityFromResource(resource: ActuationEventResource): ActuationEvent {
    return new ActuationEvent({
      id: resource.id,
      deviceId: resource.deviceId,
      environmentId: resource.environmentId,
      action: resource.action as ActuationAction,
      triggerMetric: resource.triggerMetric as MonitoredMetric | null,
      triggerState: resource.triggerState as EnvironmentalState | null,
      result: resource.result === 'FAILED' ? 'FAILED' : 'EXECUTED',
      occurredAt: resource.occurredAt,
      profileVersion: resource.profileVersion,
    });
  }

  /**
   * Converts an ActuationEvent domain entity into an API resource.
   *
   * @param entity ActuationEvent domain entity.
   * @returns API-compatible actuation event resource.
   */
  toResourceFromEntity(entity: ActuationEvent): ActuationEventResource {
    return { ...entity };
  }
}

/**
 * Assembler responsible for converting environmental profile data
 * between API resources and domain entities.
 *
 * Environmental profiles contain configuration information required
 * by IoT devices, including:
 * - Environmental thresholds.
 * - Automatic actuation rules.
 * - Configuration version tracking.
 *
 * This mapper ensures that backend representations are transformed
 * into domain objects used by application logic.
 */
export class EnvironmentalProfileAssembler implements BaseAssembler<
  EnvironmentalProfile,
  EnvironmentalProfileResource,
  EnvironmentalProfilesResponse
> {
  /**
   * Converts a collection of environmental profile resources
   * into domain entities.
   *
   * @param response Backend response containing profiles.
   * @returns Collection of EnvironmentalProfile entities.
   */
  toEntitiesFromResponse(response: EnvironmentalProfilesResponse): EnvironmentalProfile[] {
    return response.profiles.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an environmental profile resource into a domain entity.
   *
   * Maps nested threshold configurations and actuation rules
   * into domain-compatible structures.
   *
   * @param resource Environmental profile received from the backend.
   * @returns EnvironmentalProfile domain entity.
   */
  toEntityFromResource(resource: EnvironmentalProfileResource): EnvironmentalProfile {
    return new EnvironmentalProfile({
      id: resource.id,
      scope: resource.scope === 'ENVIRONMENT' ? 'ENVIRONMENT' : 'CONTAINER_MONITOR',
      environmentId: resource.environmentId,
      deviceId: resource.deviceId,
      version: resource.version,
      thresholds: resource.thresholds.map((threshold): EnvironmentalThreshold => ({
        metric: threshold.metric as MonitoredMetric,
        unit: threshold.unit ?? '',
        normalMin: threshold.normalMin,
        normalMax: threshold.normalMax,
        criticalMin: threshold.criticalMin,
        criticalMax: threshold.criticalMax,
      })),
      actuationRules: resource.actuationRules.map((rule): ActuationRule => ({
        metric: rule.metric as MonitoredMetric,
        state: rule.state === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        action: rule.action as ActuationAction,
      })),
      updatedAt: resource.updatedAt,
    });
  }

  /**
   * Converts an EnvironmentalProfile domain entity
   * into an API resource representation.
   *
   * @param entity Environmental profile domain entity.
   * @returns API-compatible environmental profile resource.
   */
  toResourceFromEntity(entity: EnvironmentalProfile): EnvironmentalProfileResource {
    return { ...entity, laboratoryId: 0, updatedBy: null };
  }
}
