import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents an action recorded in the audit log.
 *
 * @remarks
 * This type restricts audit action values to the states supported by the
 * Reporting and Analysis bounded context and the backend API contract.
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'REGISTER'
  | 'RELEASE'
  | 'REJECT'
  | 'ACKNOWLEDGE'
  | 'RESOLVE'
  | 'EXPORT'
  | 'GENERATE'
  | 'UNKNOWN';

/**
 * Represents an entry in the system audit log.
 *
 * @remarks
 * In Domain-Driven Design, AuditLogEntry is an entity that captures a historical
 * record of a specific action performed within the system. It ensures traceability
 * by linking actions to the actors who performed them and the entities they affected.
 *
 * @example
 * ```typescript
 * const log = new AuditLogEntry({
 *   id: 1,
 *   action: 'RELEASE',
 *   entityType: 'Batch',
 *   entityId: 100,
 *   performedBy: 5,
 *   timestamp: '2026-05-12T11:00:00Z',
 *   details: 'Batch released after quality validation'
 * });
 * ```
 */
export class AuditLogEntry implements BaseEntity {
  /**
   * The unique numeric identifier for this audit log entry.
   */
  id: number;

  /**
   * The action performed.
   */
  action: AuditAction;

  /**
   * The type of domain entity affected.
   */
  entityType: string;

  /**
   * The numeric identifier of the entity being acted upon.
   */
  entityId: number;

  /**
   * The numeric identifier of the user or system agent who performed the action.
   */
  performedBy: number;

  /**
   * The exact timestamp when the action occurred.
   */
  timestamp: string;

  /**
   * Additional context or serialized changes related to the action.
   */
  details: string;

  /**
   * Creates a new AuditLogEntry entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric ID of the entry
   * @param params.action - The operation performed
   * @param params.entityType - The affected domain object category
   * @param params.entityId - Numeric ID of the affected object
   * @param params.performedBy - Numeric ID of the actor
   * @param params.timestamp - Occurrence timestamp
   * @param params.details - Descriptive details of the action
   */
  constructor(params: {
    id: number;
    action: AuditAction;
    entityType: string;
    entityId: number;
    performedBy: number;
    timestamp: string;
    details: string;
  }) {
    this.id = params.id;
    this.action = params.action;
    this.entityType = params.entityType;
    this.entityId = params.entityId;
    this.performedBy = params.performedBy;
    this.timestamp = params.timestamp;
    this.details = params.details;
  }
}
