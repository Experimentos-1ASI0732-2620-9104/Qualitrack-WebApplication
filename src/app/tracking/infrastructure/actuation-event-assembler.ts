import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { ActuationAction, ActuationEvent } from '../domain/model/actuation-event.entity';
import { EnvironmentalState, MonitoredMetric } from '../domain/model/monitored-metric';
import { ActuationEventResource, ActuationEventsResponse } from './tracking-response';

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
