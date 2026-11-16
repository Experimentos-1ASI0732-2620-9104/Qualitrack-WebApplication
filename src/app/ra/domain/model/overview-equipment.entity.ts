import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Equipment counted by the operational overview, and the IoT devices whose readings it charts.
 *
 * @remarks
 * Equipment Management is the owner of the equipment; Reporting & Audit keeps only what the overview shows.
 */
export class OverviewEquipment implements BaseEntity {
  id: number;

  laboratoryId: number;

  environmentId: number | null;

  name: string;

  /** `ENVIRONMENTAL_DEVICE` or `CONTAINER_MONITOR` for IoT devices; null for process equipment. */
  deviceType: string | null;

  constructor(params: {
    id: number;
    laboratoryId: number;
    environmentId: number | null;
    name: string;
    deviceType: string | null;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.environmentId = params.environmentId;
    this.name = params.name;
    this.deviceType = params.deviceType;
  }

  /** Whether the equipment is an IoT device that reports readings. */
  get isIotDevice(): boolean {
    return this.deviceType !== null;
  }

  /** Whether the device monitors a container, whose readings are read by device. */
  get isContainerMonitor(): boolean {
    return this.deviceType === 'CONTAINER_MONITOR';
  }
}
