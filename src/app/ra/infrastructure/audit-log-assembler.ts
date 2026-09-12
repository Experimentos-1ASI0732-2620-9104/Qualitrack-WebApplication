import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { AuditLogEntry } from '../domain/model/audit-log-entry.entity';
import { AuditLogEntryResource, AuditLogEntriesResponse } from './audit-log-response';

/**
 * Assembler for converting between audit log domain entities and API resources.
 *
 * @remarks
 * In DDD, this assembler translates between:
 * - {@link AuditLogEntry} domain entities
 * - {@link AuditLogEntryResource} infrastructure resources
 * - {@link AuditLogEntriesResponse} collection response envelopes
 *
 * This allows the audit log domain model to remain independent from HTTP payloads.
 */
export class AuditLogAssembler implements BaseAssembler<
  AuditLogEntry,
  AuditLogEntryResource,
  AuditLogEntriesResponse
> {
  /**
   * Converts an audit log response envelope into domain entities.
   *
   * @param response - API response envelope containing audit log resources
   * @returns Array of audit log domain entities
   */
  toEntitiesFromResponse(response: AuditLogEntriesResponse): AuditLogEntry[] {
    return response.auditLogs.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an array of audit log resources into domain entities.
   *
   * @param resources - Array of audit log resources returned by the backend
   * @returns Array of audit log domain entities
   *
   * @remarks
   * Use this method when the backend returns a direct JSON array instead of a wrapper.
   */
  toEntitiesFromResources(resources: AuditLogEntryResource[]): AuditLogEntry[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an audit log resource into a domain entity.
   *
   * @param resource - Audit log API resource
   * @returns A new {@link AuditLogEntry} domain entity
   */
  toEntityFromResource(resource: AuditLogEntryResource): AuditLogEntry {
    return new AuditLogEntry({
      id: resource.id,
      action: resource.action,
      entityType: resource.entityType,
      entityId: resource.entityId,
      performedBy: resource.performedBy,
      timestamp: resource.timestamp,
      details: resource.details,
    });
  }

  /**
   * Converts an audit log domain entity into an API resource.
   *
   * @param entity - Audit log domain entity
   * @returns Audit log resource suitable for HTTP communication
   */
  toResourceFromEntity(entity: AuditLogEntry): AuditLogEntryResource {
    return {
      id: entity.id,
      action: entity.action,
      entityType: entity.entityType,
      entityId: entity.entityId,
      performedBy: entity.performedBy,
      timestamp: entity.timestamp,
      details: entity.details,
    };
  }
}
