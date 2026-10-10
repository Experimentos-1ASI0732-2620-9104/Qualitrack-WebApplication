import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * How serious a deviation is.
 *
 * @remarks
 * - `LOW`: slightly outside the limit.
 * - `WARNING`: needs attention.
 * - `CRITICAL`: needs immediate attention; only critical alerts can be e-mailed again.
 *
 * The values are ordered from least to most serious. Within one alert the severity only rises.
 */
export type AlertSeverity = 'LOW' | 'WARNING' | 'CRITICAL';

/**
 * Where an alert is in its life cycle.
 *
 * @remarks
 * An alert moves forward only: `UNRESOLVED` (nobody attends it yet), `ACKNOWLEDGED` (a person attends it) and
 * `RESOLVED` (a person closed it with a resolution). `UNRESOLVED` and `ACKNOWLEDGED` alerts are open.
 */
export type AlertStatus = 'UNRESOLVED' | 'ACKNOWLEDGED' | 'RESOLVED';

/** Whether the alert originated in the environment (environmental device) or in a monitored container (US86). */
export type AlertOrigin = 'ENVIRONMENT' | 'CONTAINER';

/** Action executed by the container monitor for the variable of an alert while the incident was open (US86). */
export interface RelatedActuation {
  /** Unique identifier of the actuation. */
  id: number;
  /** What the monitor did, for example turning a device on or off. */
  action: string;
  /** State of the variable that triggered the action, when the monitor reported it. */
  triggerState: string | null;
  /** Outcome of the action. */
  result: string;
  /** When the action was executed, as an ISO 8601 date-time. */
  occurredAt: string;
}

/**
 * Deviation alert of an environment or of one of its monitored containers (US85-US88).
 *
 * @remarks
 * An alert is one incident: while it is open, new deviations of the same device and variable are counted in it, its
 * severity only rises and a return to normal is noted, but only a person closes it with a resolution.
 *
 * Fields that the list of alerts does not send are `null` (or the defaults of the constructor); the alert detail
 * also fills {@link DeviationAlert.relatedActuations}.
 *
 * @example
 * ```typescript
 * const alert = new DeviationAlert({
 *   id: 7,
 *   equipmentId: 12,
 *   parameterName: 'Temperature',
 *   recordedValue: 9.4,
 *   thresholdValue: 8,
 *   unit: '°C',
 *   timestamp: '2026-10-04T10:00:00Z',
 *   severity: 'WARNING',
 *   status: 'UNRESOLVED',
 * });
 *
 * console.log(alert.isOpen); // true
 * console.log(alert.deviationCount); // 1
 * ```
 */
export class DeviationAlert implements BaseEntity {
  /** Unique identifier of the alert. */
  id: number;
  /** Laboratory the alert belongs to. */
  laboratoryId: number | null;
  /** Environment where the incident happened. */
  environmentId: number | null;
  /** Whether the incident came from the environment or from a monitored container. */
  origin: AlertOrigin | null;
  /** Environmental device, container monitor or equipment that detected the deviation. */
  equipmentId: number;
  /** Batch stored in the monitored container, when the alert came from one. */
  batchId: number | null;
  /** Measurement that opened the incident. */
  measurementId: number | null;
  /** Latest measurement that confirmed the deviation. */
  lastMeasurementId: number | null;
  /** Variable that deviated, for example the temperature or the humidity. */
  parameterName: string;
  /** Value and limit of the deviation that set the current severity. */
  recordedValue: number;
  thresholdValue: number;
  /** Unit of {@link DeviationAlert.recordedValue} and {@link DeviationAlert.thresholdValue}. */
  unit: string;
  /** When the incident started. */
  timestamp: string;
  /** Highest severity reached by the incident. */
  severity: AlertSeverity;
  /** Current step of the life cycle. */
  status: AlertStatus;
  /** How many deviations of the same device and variable were counted in the incident, at least 1. */
  deviationCount: number;
  /** When the latest deviation of the incident was detected. */
  lastDetectedAt: string | null;
  /** When the condition returned to normal; the alert stays open until a person resolves it. */
  normalizedAt: string | null;
  /** User who acknowledged the alert. */
  acknowledgedBy: number | null;
  /** When the alert was acknowledged. */
  acknowledgedAt: string | null;
  /** User who resolved the alert. */
  resolvedBy: number | null;
  /** When the alert was resolved. */
  resolvedAt: string | null;
  /** What the person did to resolve the incident. */
  resolutionNotes: string | null;
  /** Only filled by the alert detail. */
  relatedActuations: RelatedActuation[];

  /**
   * Creates a new DeviationAlert entity.
   *
   * @param params - Initialization properties; see the fields of the class for the meaning of each one
   *
   * @remarks
   * Optional values default to `null`, except `deviationCount`, which defaults to 1, and `relatedActuations`,
   * which defaults to an empty list.
   */
  constructor(params: {
    id: number;
    laboratoryId?: number | null;
    environmentId?: number | null;
    origin?: AlertOrigin | null;
    equipmentId: number;
    batchId?: number | null;
    measurementId?: number | null;
    lastMeasurementId?: number | null;
    parameterName: string;
    recordedValue: number;
    thresholdValue: number;
    unit: string;
    timestamp: string;
    severity: AlertSeverity;
    status: AlertStatus;
    deviationCount?: number | null;
    lastDetectedAt?: string | null;
    normalizedAt?: string | null;
    acknowledgedBy?: number | null;
    acknowledgedAt?: string | null;
    resolvedBy?: number | null;
    resolvedAt?: string | null;
    resolutionNotes?: string | null;
    relatedActuations?: RelatedActuation[];
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId ?? null;
    this.environmentId = params.environmentId ?? null;
    this.origin = params.origin ?? null;
    this.equipmentId = params.equipmentId;
    this.batchId = params.batchId ?? null;
    this.measurementId = params.measurementId ?? null;
    this.lastMeasurementId = params.lastMeasurementId ?? null;
    this.parameterName = params.parameterName;
    this.recordedValue = params.recordedValue;
    this.thresholdValue = params.thresholdValue;
    this.unit = params.unit;
    this.timestamp = params.timestamp;
    this.severity = params.severity;
    this.status = params.status;
    this.deviationCount = params.deviationCount ?? 1;
    this.lastDetectedAt = params.lastDetectedAt ?? null;
    this.normalizedAt = params.normalizedAt ?? null;
    this.acknowledgedBy = params.acknowledgedBy ?? null;
    this.acknowledgedAt = params.acknowledgedAt ?? null;
    this.resolvedBy = params.resolvedBy ?? null;
    this.resolvedAt = params.resolvedAt ?? null;
    this.resolutionNotes = params.resolutionNotes ?? null;
    this.relatedActuations = params.relatedActuations ?? [];
  }

  /** `true` while the alert is unresolved or being attended, `false` once it is resolved. */
  get isOpen(): boolean {
    return this.status !== 'RESOLVED';
  }

  /** `true` when the condition returned to normal after the latest deviation but the alert is still open. */
  get isNormalized(): boolean {
    return this.isOpen && this.normalizedAt !== null;
  }
}
