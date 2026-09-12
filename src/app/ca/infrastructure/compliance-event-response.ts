import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a compliance event for API communication.
 *
 * @remarks
 * In DDD, this is an infrastructure-level resource contract that represents
 * the compliance event as it appears in HTTP communication, without domain logic.
 * Resources serve as the bridge between the domain layer (ComplianceEvent entity)
 * and external systems, ensuring proper separation of concerns.
 *
 * This resource captures the audit trail data, including identifiers for related
 * entities and resolution details for traceability.
 */
export interface ComplianceEventResource extends BaseResource {
  /**
   * Unique numeric identifier for the compliance event resource.
   */
  id: number;

  /**
   * Numeric identifier for the domain entity related to this event.
   * This serves as a reference to the aggregate or object being audited.
   */
  relatedEntityId: number;

  /**
   * The classification or type of the compliance event.
   */
  eventType: string;

  /**
   * A detailed description of the event's content or occurrence.
   */
  description: string;

  /**
   * The timestamp of when the event originally occurred.
   */
  timestamp: string;

  /**
   * (Optional) The numeric identifier of the agent or system that resolved the event.
   */
  resolvedBy?: number;

  /**
   * The timestamp of when the record was created in the system.
   */
  createdAt?: string;
}

/**
 * Response envelope for compliance event collection queries.
 *
 * @remarks
 * This interface defines the structure of API responses that return multiple compliance events.
 * The envelope pattern allows for consistent metadata handling and potential future
 * additions like pagination or filtering metadata.
 *
 * @example
 * ```typescript
 * // API returns:
 * // {
 * //   complianceEvents: [
 * //     { id: 1, eventType: 'LOGIN', relatedEntityId: 123, ... },
 * //     { id: 2, eventType: 'LOGOUT', relatedEntityId: 123, ... }
 * //   ]
 * // }
 * ```
 */
export interface ComplianceEventsResponse extends BaseResponse {
  /**
   * Array of compliance event resources included in the response.
   * Contains zero or more ComplianceEventResource objects, each representing an event
   * that can be converted into a ComplianceEvent domain entity.
   */
  complianceEvents: ComplianceEventResource[];
}
