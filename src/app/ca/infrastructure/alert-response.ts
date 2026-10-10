import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AlertOrigin, AlertSeverity, AlertStatus } from '../domain/model/deviation-alert.entity';

/** Deviation alert as returned by /laboratories/{laboratoryId}/environments/{environmentId}/deviation-alerts. */
export interface AlertResource extends BaseResource {
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
  /** Value of the deviation that set the current severity. */
  recordedValue: number;
  /** Limit that the recorded value went beyond. */
  thresholdValue: number;
  /** Unit of the recorded and threshold values. */
  unit: string;
  /** When the incident started, as an ISO 8601 date-time. */
  timestamp: string;
  /** Highest severity reached by the incident. */
  severity: AlertSeverity;
  /** Current step of the life cycle. */
  status: AlertStatus;
  /** How many deviations were counted in the incident; the entity defaults it to 1 when missing. */
  deviationCount: number | null;
  /** When the latest deviation was detected. */
  lastDetectedAt: string | null;
  /** When the condition returned to normal. */
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
}

/** Action related to an alert, part of GET /deviation-alerts/{alertId}. */
export interface RelatedActuationResource {
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

/** Alert detail: the alert and the actions related to its incident (US86). */
export interface AlertDetailResource extends AlertResource {
  /** Actions executed by the container monitor for the variable of the alert while the incident was open. */
  relatedActuations: RelatedActuationResource[];
}

/**
 * Envelope kept for the base assembler; the API answers the list of alerts with a plain array.
 */
export interface AlertsResponse extends BaseResponse {
  /** Alerts included in the response. */
  alerts: AlertResource[];
}
