import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { ComplianceEvent } from '../domain/model/compliance-event.entity';
import { ComplianceEventResource, ComplianceEventsResponse } from './compliance-event-response';

/**
 * Assembler for converting between ComplianceEvent domain entities and infrastructure resources.
 *
 * @remarks
 * In DDD, this assembler is responsible for transforming between:
 * - {@link ComplianceEvent} - Domain entity with compliance-specific logic
 * - {@link ComplianceEventResource} - Infrastructure resource for API communication
 * - {@link ComplianceEventsResponse} - Response envelope from collection operations
 *
 * This ensures the domain layer remains decoupled from infrastructure concerns
 * like API response formats, serialization details, and wire protocol specifics.
 *
 * @example
 * ```typescript
 * const assembler = new ComplianceEventAssembler();
 *
 * // From API response to domain entities
 * const events = assembler.toEntitiesFromResponse(apiResponse);
 *
 * // From domain entity to API resource
 * const resource = assembler.toResourceFromEntity(complianceEvent);
 * ```
 */
export class ComplianceEventAssembler implements BaseAssembler<
  ComplianceEvent,
  ComplianceEventResource,
  ComplianceEventsResponse
> {
  /**
   * Converts a collection response into an array of domain entities.
   *
   * @param response - The API response containing compliance event resources
   * @returns Array of ComplianceEvent domain entities
   *
   * @remarks
   * Extracts the complianceEvents array from the response envelope and converts
   * each resource into a domain ComplianceEvent entity using the individual mapper.
   */
  toEntitiesFromResponse(response: ComplianceEventsResponse): ComplianceEvent[] {
    return response.complianceEvents.map((event) => this.toEntityFromResource(event));
  }

  /**
   * Converts an array of resources into an array of domain entities.
   *
   * @param resources - Array of compliance event resources
   * @returns Array of ComplianceEvent domain entities
   */
  toEntitiesFromResources(resources: ComplianceEventResource[]): ComplianceEvent[] {
    return resources.map((event) => this.toEntityFromResource(event));
  }

  /**
   * Converts an infrastructure resource into a domain entity.
   *
   * @param resource - The ComplianceEventResource to convert
   * @returns A new ComplianceEvent domain entity
   *
   * @remarks
   * Maps resource properties directly to entity properties, ensuring the
   * returned entity is instantiated with the correct audit trail state.
   */
  toEntityFromResource(resource: ComplianceEventResource): ComplianceEvent {
    return new ComplianceEvent({
      id: resource.id,
      relatedEntityId: resource.relatedEntityId,
      eventType: resource.eventType,
      description: resource.description,
      timestamp: resource.timestamp,
      resolvedBy: resource.resolvedBy,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts a domain entity into an infrastructure resource.
   *
   * @param entity - The ComplianceEvent domain entity to convert
   * @returns A new ComplianceEventResource suitable for API communication
   *
   * @remarks
   * Extracts only the core event data for API serialization, excluding
   * any domain logic or transient properties that should not be sent over the wire.
   */
  toResourceFromEntity(entity: ComplianceEvent): ComplianceEventResource {
    return {
      id: entity.id,
      relatedEntityId: entity.relatedEntityId,
      eventType: entity.eventType,
      description: entity.description,
      timestamp: entity.timestamp,
      resolvedBy: entity.resolvedBy,
      createdAt: entity.createdAt,
    };
  }
}
