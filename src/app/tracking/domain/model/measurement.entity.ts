import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a single recorded telemetry or process measurement.
 *
 * @remarks
 * In Domain-Driven Design, Measurement is an entity that captures a specific
 * physical or operational value recorded by a piece of equipment at a given time.
 * These measurements are the foundational data points used to evaluate equipment health,
 * detect deviations, and analyze historical trends.
 */
export class Measurement implements BaseEntity {
  /**
   * The unique numeric identifier for this measurement record.
   */
  id: number;

  /**
   * The numeric identifier of the equipment that recorded this measurement.
   */
  equipmentId: number;

  /**
   * The name of the parameter being measured (e.g., 'Temperature', 'Pressure').
   */
  parameterName: string;

  /**
   * The actual recorded value of the measurement.
   */
  value: number;

  /**
   * The unit of measurement (e.g., 'Celsius', 'PSI', 'RPM').
   */
  unit: string;

  /**
   * The exact timestamp when the measurement was recorded by the equipment.
   */
  timestamp: string;

  /**
   * The timestamp when this measurement record was persisted or ingested into the system.
   */
  createdAt: string;

  /**
   * Creates a new Measurement entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric ID of the measurement
   * @param params.equipmentId - Numeric ID of the associated equipment
   * @param params.parameterName - Name of the measured variable
   * @param params.value - Recorded magnitude or value
   * @param params.unit - Unit of measurement
   * @param params.timestamp - Recording time from the source
   * @param params.createdAt - System ingestion time
   */
  constructor(params: {
    id: number;
    equipmentId: number;
    parameterName: string;
    value: number;
    unit: string;
    timestamp: string;
    createdAt: string;
  }) {
    this.id = params.id;
    this.equipmentId = params.equipmentId;
    this.parameterName = params.parameterName;
    this.value = params.value;
    this.unit = params.unit;
    this.timestamp = params.timestamp;
    this.createdAt = params.createdAt;
  }
}
