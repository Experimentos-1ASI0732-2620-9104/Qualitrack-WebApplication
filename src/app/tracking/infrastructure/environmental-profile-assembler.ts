import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { ActuationAction } from '../domain/model/actuation-event.entity';
import { ActuationRule, EnvironmentalProfile, EnvironmentalThreshold } from '../domain/model/environmental-profile.entity';
import { MonitoredMetric } from '../domain/model/monitored-metric';
import { EnvironmentalProfileResource, EnvironmentalProfilesResponse } from './tracking-response';

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
