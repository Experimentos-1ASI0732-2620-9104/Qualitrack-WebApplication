import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Type of an IoT device as Tracking & Telemetry reads it: the environmental device of an environment or the monitor
 * of a container.
 */
export type MonitoredDeviceType = 'ENVIRONMENTAL_DEVICE' | 'CONTAINER_MONITOR';

/**
 * IoT device whose readings, profiles and connection Tracking & Telemetry follows.
 *
 * @remarks
 * Equipment Management is the owner of the physical device (identity, location, status). Tracking & Telemetry
 * keeps its own reference to it, translated by an Anti-Corruption Layer, as the Context Mapping of the report
 * defines for Equipment → Tracking.
 */
export class MonitoredDevice implements BaseEntity {
  id: number;

  name: string;

  deviceType: MonitoredDeviceType;

  environmentId: number | null;

  constructor(params: { id: number; name: string; deviceType: MonitoredDeviceType; environmentId: number | null }) {
    this.id = params.id;
    this.name = params.name;
    this.deviceType = params.deviceType;
    this.environmentId = params.environmentId;
  }

  /** Whether the device monitors a container, whose readings and profile are addressed by device. */
  get isContainerMonitor(): boolean {
    return this.deviceType === 'CONTAINER_MONITOR';
  }
}
