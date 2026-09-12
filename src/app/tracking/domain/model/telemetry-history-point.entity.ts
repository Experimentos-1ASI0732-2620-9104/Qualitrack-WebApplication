import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a historical record of a specific telemetry data point.
 *
 * @remarks
 * In Domain-Driven Design, TelemetryHistoryPoint is an entity that captures
 * a time-series measurement from a piece of equipment for long-term storage and analysis.
 * Unlike real-time status or raw incoming measurements, these points are often
 * evaluated for deviations and are used extensively in generating deviation trends,
 * predictive maintenance models, and compliance batch reports.
 */
export class TelemetryHistoryPoint implements BaseEntity {
  /**
   * The unique numeric identifier for this historical data point.
   */
  id: number;

  /**
   * The numeric identifier of the equipment that generated this telemetry.
   */
  equipmentId: number;

  /**
   * The name of the process parameter that was measured (e.g., 'Temperature', 'Humidity').
   */
  parameterName: string;

  /**
   * The actual value recorded for the parameter at the given timestamp.
   */
  recordedValue: number;

  /**
   * The exact timestamp when the telemetry reading was captured by the equipment sensor.
   */
  timestamp: string;

  /**
   * Flag indicating whether this specific data point was identified as an anomaly
   * or deviation from acceptable operational thresholds at the time of recording.
   */
  isAnomaly: boolean;

  /**
   * The timestamp when this historical record was persisted into the system.
   */
  createdAt: string;

  /**
   * Creates a new TelemetryHistoryPoint entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric ID of the history point
   * @param params.equipmentId - Numeric ID of the associated equipment
   * @param params.parameterName - Name of the monitored variable
   * @param params.recordedValue - The measured value
   * @param params.timestamp - Time of measurement
   * @param params.isAnomaly - Deviation status flag
   * @param params.createdAt - Record creation time
   */
  constructor(params: {
    id: number;
    equipmentId: number;
    parameterName: string;
    recordedValue: number;
    timestamp: string;
    isAnomaly: boolean;
    createdAt: string;
  }) {
    this.id = params.id;
    this.equipmentId = params.equipmentId;
    this.parameterName = params.parameterName;
    this.recordedValue = params.recordedValue;
    this.timestamp = params.timestamp;
    this.isAnomaly = params.isAnomaly;
    this.createdAt = params.createdAt;
  }
}
