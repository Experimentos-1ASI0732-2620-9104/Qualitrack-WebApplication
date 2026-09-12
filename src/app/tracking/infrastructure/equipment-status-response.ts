import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { TelemetryStatus } from '../domain/model/equipment-status.entity';

/**
 * Resource representation of an equipment telemetry status for API communication.
 *
 * @remarks
 * In DDD, this resource belongs to the infrastructure layer and defines the
 * HTTP contract for equipment status data. It represents the real-time health
 * state of a piece of equipment as exposed by the backend API.
 */
export interface EquipmentStatusResource extends BaseResource {
  /**
   * The unique numeric identifier of the equipment status resource.
   */
  id: number;

  /**
   * The numeric identifier of the equipment this status belongs to.
   */
  equipmentId: number;

  /**
   * Indicates whether the equipment is currently communicating with the system.
   */
  isOnline: boolean;

  /**
   * The current evaluated telemetry health state of the equipment.
   */
  currentStatus: TelemetryStatus;

  /**
   * The exact timestamp of the last successful heartbeat received from the equipment.
   */
  lastHeartbeat: string;

  /**
   * The timestamp when this status resource was created in the system.
   */
  createdAt: string;
}

/**
 * Response envelope for equipment status collection queries.
 *
 * @remarks
 * This response is useful when the API returns multiple equipment status records,
 * for example when listing the current telemetry state of several devices.
 */
export interface EquipmentStatusesResponse extends BaseResponse {
  /**
   * Array of equipment status resources returned by the API.
   */
  statuses: EquipmentStatusResource[];
}
