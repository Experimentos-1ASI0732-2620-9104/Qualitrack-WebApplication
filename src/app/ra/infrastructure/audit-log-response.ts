import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AuditAction } from '../domain/model/audit-log-entry.entity';

/**
 * Resource representation of an audit log entry for API communication.
 *
 * @remarks
 * In DDD, this resource belongs to the infrastructure layer and represents
 * the audit log payload as it appears in HTTP responses. It is converted into
 * an {@link AuditLogEntry} domain entity by the audit log assembler.
 */
export interface AuditLogEntryResource extends BaseResource {
  /**
   * The unique numeric identifier for the audit log resource.
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
}

/**
 * Response envelope for audit log collection queries.
 *
 * @remarks
 * Kept for compatibility with the shared {@link BaseAssembler} contract.
 * For the aligned backend, the list endpoint should preferably return
 * a direct {@link AuditLogEntryResource} array.
 */
export interface AuditLogEntriesResponse extends BaseResponse {
  /**
   * Array of audit log entry resources included in the response.
   */
  auditLogs: AuditLogEntryResource[];
}
