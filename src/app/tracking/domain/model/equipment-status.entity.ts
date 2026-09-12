import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Defines the possible operational states of an equipment's telemetry connection.
 */
export type TelemetryStatus = 'OPERATIONAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

/**
 * Represents the real-time operational status and connectivity of a piece of equipment.
 *
 * @remarks
 * In Domain-Driven Design, EquipmentStatus is an entity that encapsulates
 * the current health and network presence of a laboratory asset. It is updated
 * frequently by incoming telemetry streams and is used to monitor operational
 * readiness and trigger maintenance or connection alerts.
 */
export class EquipmentStatus implements BaseEntity {
  /**
   * The unique numeric identifier for this status record.
   */
  id: number;

  /**
   * The numeric identifier of the equipment this status belongs to.
   */
  equipmentId: number;

  /**
   * Indicates whether the equipment is currently actively communicating with the network.
   */
  isOnline: boolean;

  /**
   * The evaluated health state of the equipment based on its latest telemetry data.
   */
  currentStatus: TelemetryStatus;

  /**
   * The exact timestamp of the last successfully received communication from the equipment.
   */
  lastHeartbeat: string;

  /**
   * The timestamp when this status record was created or registered in the system.
   */
  createdAt: string;

  /**
   * Creates a new EquipmentStatus entity.
   *
   * @param params - Initialization properties
   * @param params.id - Unique numeric ID of the status record
   * @param params.equipmentId - Numeric ID of the associated equipment
   * @param params.isOnline - Network connectivity flag
   * @param params.currentStatus - Evaluated telemetry health state
   * @param params.lastHeartbeat - Timestamp of the latest ping/data payload
   * @param params.createdAt - Record creation timestamp
   */
  constructor(params: {
    id: number;
    equipmentId: number;
    isOnline: boolean;
    currentStatus: TelemetryStatus;
    lastHeartbeat: string;
    createdAt: string;
  }) {
    this.id = params.id;
    this.equipmentId = params.equipmentId;
    this.isOnline = params.isOnline;
    this.currentStatus = params.currentStatus;
    this.lastHeartbeat = params.lastHeartbeat;
    this.createdAt = params.createdAt;
  }
}
