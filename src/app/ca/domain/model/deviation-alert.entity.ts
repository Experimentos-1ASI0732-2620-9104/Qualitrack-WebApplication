import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type AlertSeverity = 'LOW' | 'WARNING' | 'CRITICAL';

export type AlertStatus = 'UNRESOLVED' | 'ACKNOWLEDGED' | 'RESOLVED';

/**
 * Represents a deviation alert within the Manufacturing or Quality domain.
 *
 * @remarks
 * In Domain-Driven Design, a DeviationAlert is an entity that captures an anomaly
 * detected during a process. It records when a specific parameter exceeds its
 * defined threshold, allowing for traceability and corrective actions.
 *
 * This entity is crucial for maintaining quality standards and operational
 * integrity within the bounded context of process monitoring.
 *
 * @example
 * ```typescript
 * const temperatureAlert = new DeviationAlert({
 * id: 1,
 * equipmentId: 202,
 * parameterName: 'Temperature',
 * recordedValue: 85.5,
 * thresholdValue: 80.0,
 * unit: '°C',
 * timestamp: '2026-05-12T11:00:00Z',
 * severity: 'CRITICAL',
 * status: 'UNRESOLVED',
 * createdAt: '2026-05-12T11:05:00Z'
 * });
 *
 * console.log(temperatureAlert.severity); // 'CRITICAL'
 * ```
 */
export class DeviationAlert implements BaseEntity {
  /**
   * The unique numeric identifier for this deviation alert.
   */
  id: number;

  /**
   * The numeric identifier of the equipment where the deviation was detected.
   */
  equipmentId: number;

  /**
   * The numeric identifier of the production batch associated with the alert, if applicable.
   */
  batchId?: number;

  /**
   * The name of the process parameter that deviated (e.g., Pressure, Temperature).
   */
  parameterName: string;

  /**
   * The actual value measured at the time of the deviation.
   */
  recordedValue: number;

  /**
   * The maximum or minimum allowed limit for the parameter.
   */
  thresholdValue: number;

  /**
   * The unit of measurement for the recorded and threshold values.
   */
  unit: string;

  /**
   * The exact moment when the deviation was detected by the sensors or system.
   */
  timestamp: string;

  /**
   * The level of impact or urgency.
   */
  severity: AlertSeverity;

  /**
   * The current lifecycle state of the alert.
   */
  status: AlertStatus;

  /**
   * The timestamp indicating when the alert record was created in the system.
   */
  createdAt?: string;

  /**
   * Creates a new DeviationAlert entity.
   *
   * @param params - Initialization properties
   * @param params.id - The unique numeric identifier for the alert
   * @param params.equipmentId - Numeric ID of the source equipment
   * @param params.batchId - (Optional) Numeric ID of the production batch
   * @param params.parameterName - Name of the monitored variable
   * @param params.recordedValue - The out-of-range value measured
   * @param params.thresholdValue - The limit that was exceeded
   * @param params.unit - Unit of measurement
   * @param params.timestamp - Date and time of the occurrence
   * @param params.severity - Urgency level of the alert
   * @param params.status - Current state of the alert
   * @param params.createdAt - Record creation timestamp
   *
   * @remarks
   * The constructor initializes the entity with all necessary telemetry and
   * contextual data required to analyze a process deviation.
   */
  constructor(params: {
    id: number;
    equipmentId: number;
    batchId?: number;
    parameterName: string;
    recordedValue: number;
    thresholdValue: number;
    unit: string;
    timestamp: string;
    severity: AlertSeverity;
    status: AlertStatus;
    createdAt?: string;
  }) {
    this.id = params.id;
    this.equipmentId = params.equipmentId;
    this.batchId = params.batchId;
    this.parameterName = params.parameterName;
    this.recordedValue = params.recordedValue;
    this.thresholdValue = params.thresholdValue;
    this.unit = params.unit;
    this.timestamp = params.timestamp;
    this.severity = params.severity;
    this.status = params.status;
    this.createdAt = params.createdAt;
  }
}
