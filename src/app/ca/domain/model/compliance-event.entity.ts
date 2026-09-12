import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a compliance event within the Compliance domain.
 *
 * @remarks
 * In Domain-Driven Design, a ComplianceEvent is an entity that captures a specific
 * occurrence or incident related to regulatory or internal standards. It maintains
 * a unique identity and records the state of compliance at a specific point in time.
 *
 * This entity models the audit trail and monitoring aspects of the domain,
 * ensuring all relevant events are tracked and attributable.
 *
 * @example
 * ```typescript
 * const securityEvent = new ComplianceEvent({
 * id: 1,
 * relatedEntityId: 456,
 * eventType: 'UNAUTHORIZED_ACCESS',
 * description: 'Attempted access to restricted resource',
 * timestamp: '2026-05-12T10:00:00Z',
 * createdAt: '2026-05-12T10:05:00Z'
 * });
 *
 * console.log(securityEvent.eventType); // 'UNAUTHORIZED_ACCESS'
 * ```
 */
export class ComplianceEvent implements BaseEntity {
  /**
   * The unique numeric identifier for this compliance event.
   */
  id: number;

  /**
   * The numeric identifier of the entity (e.g., User, Asset) related to this event.
   */
  relatedEntityId: number;

  /**
   * The classification or category of the compliance event.
   */
  eventType: string;

  /**
   * A detailed explanation of the event and its context.
   */
  description: string;

  /**
   * The exact moment when the event actually occurred.
   */
  timestamp: string;

  /**
   * The numeric identifier of the agent or system that addressed the event, if applicable.
   */
  resolvedBy?: number;

  /**
   * The timestamp indicating when this record was persisted in the system.
   */
  createdAt?: string;

  /**
   * Creates a new ComplianceEvent entity.
   *
   * @param params - Initialization properties
   * @param params.id - The unique numeric identifier for the event
   * @param params.relatedEntityId - Numeric ID of the entity associated with this event
   * @param params.eventType - The type/category of the event
   * @param params.description - Detailed description of the occurrence
   * @param params.timestamp - Original occurrence date and time
   * @param params.resolvedBy - (Optional) Numeric ID of the entity that resolved the event
   * @param params.createdAt - Creation date of the record
   *
   * @remarks
   * Constructor initializes the compliance event with the provided values.
   * As an entity, the ID is fundamental to its identity across the domain.
   */
  constructor(params: {
    id: number;
    relatedEntityId: number;
    eventType: string;
    description: string;
    timestamp: string;
    resolvedBy?: number;
    createdAt?: string;
  }) {
    this.id = params.id;
    this.relatedEntityId = params.relatedEntityId;
    this.eventType = params.eventType;
    this.description = params.description;
    this.timestamp = params.timestamp;
    this.resolvedBy = params.resolvedBy;
    this.createdAt = params.createdAt;
  }
}
