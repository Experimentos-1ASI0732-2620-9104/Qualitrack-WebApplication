import {AuditAction, AuditLogEntry} from '../../domain/model/audit-log-entry.entity';
import { LABORATORY_TIME_ZONE } from '../../../shared/presentation/utils/local-date';

/** Columns to display in the audit log data table. */
export const AUDIT_LOG_COLUMNS = ['timestamp', 'action', 'entity', 'performedBy'] as const;
export type AuditLogColumn = (typeof AUDIT_LOG_COLUMNS)[number];

/**
 * Resolves the CSS class for the action badge based on the audit action.
 *
 * @param action - The audit action recorded in the log entry
 * @returns The CSS class name to apply
 */
export function actionBadgeClass(action: AuditAction): string {
  switch (action) {
    case 'CREATE':
    case 'REGISTER':
      return 'badge-create';
    case 'UPDATE':
      return 'badge-update';
    case 'DELETE':
      return 'badge-delete';
    case 'RELEASE':
    case 'ACKNOWLEDGE':
    case 'RESOLVE':
    case 'GENERATE':
    case 'EXPORT':
      return 'badge-success';
    case 'REJECT':
      return 'badge-danger';
    case 'UNKNOWN':
    default:
      return 'badge-default';
  }
}

/**
 * Checks if an identifier typed in the filter is not a positive integer.
 *
 * @remarks
 * A null or empty value means the filter is not being used, so it is considered valid.
 *
 * @param value - The identifier to validate
 * @returns True if the value is filled in and is not a positive integer
 */
export function isInvalidId(value: number | null | '' | undefined): boolean {
  if (value === null || value === undefined || (value as unknown) === '') return false;
  const n = Number(value);
  return !Number.isInteger(n) || n < 1;
}

/** Query payload sent to the backend to filter audit logs. */
export interface AuditLogQuery {
  equipmentId?: number;
  batchId?: number;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Builds the audit log query from the form state, omitting empty fields.
 *
 * @param filters - The current state of the filter form
 * @returns The query object, or undefined if no filters are applied
 */
export function buildAuditLogQuery(filters: {
  equipmentId: number | null;
  batchId: number | null;
  dateFrom: Date | null;
  dateTo: Date | null;
}): AuditLogQuery | undefined {
  const query: AuditLogQuery = {};
  if (filters.equipmentId !== null) query.equipmentId = Number(filters.equipmentId);
  if (filters.batchId !== null) query.batchId = Number(filters.batchId);
  if (filters.dateFrom) query.dateFrom = filters.dateFrom.toISOString();
  if (filters.dateTo) query.dateTo = filters.dateTo.toISOString();
  return Object.keys(query).length > 0 ? query : undefined;
}

/**
 * Returns the default empty state for the filter form.
 *
 * @returns An object with all filter fields set to null
 */
export function emptyAuditLogFilters() {
  return {
    equipmentId: null as number | null,
    batchId: null as number | null,
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  };
}

/** View model for a row in the audit log table, pre-formatted for the UI. */
export interface AuditLogRow {
  entry: AuditLogEntry;
  badgeClass: string;
  dateLabel: string;
  timeLabel: string;
  entityType: string;
  entityId: number;
  performedBy: number;
  action: AuditAction;
  timestamp: string;
}

/**
 * Transforms store entities into pre-formatted rows ready for the table.
 *
 * @remarks
 * Date formatting is delegated to `Intl` with an explicit locale to ensure
 * consistency between the UI and the user's language.
 *
 * @param entries - The raw audit log entries from the store
 * @param locale - The locale string for date formatting
 * @returns An array of formatted view models
 *//**
 * Transforma los entries del store en filas listas para pintar.
 * El formateo de fecha se delega a `Intl` con locale explícito (inyectado por el caller).
 */
export function toAuditLogRows(
  entries: readonly AuditLogEntry[],
  locale: string,
): AuditLogRow[] {
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: LABORATORY_TIME_ZONE });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: 'medium', timeZone: LABORATORY_TIME_ZONE });
  return entries.map((entry) => {
    const date = new Date(entry.timestamp);
    return {
      entry,
      badgeClass: actionBadgeClass(entry.action),
      dateLabel: dateFmt.format(date),
      timeLabel: timeFmt.format(date),
      entityType: entry.entityType,
      entityId: entry.entityId,
      performedBy: entry.performedBy,
      action: entry.action,
      timestamp: entry.timestamp,
    };
  });
}
