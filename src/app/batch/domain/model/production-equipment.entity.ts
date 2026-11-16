import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Equipment that a production batch uses or where it is stored.
 *
 * @remarks
 * Equipment Management is the owner of the equipment and its availability; Product Batch Management keeps its own
 * reference to associate the equipment used during manufacturing and the container monitor where the batch is
 * stored (Customer/Supplier relation Equipment → Product Batch of the report).
 */
export class ProductionEquipment implements BaseEntity {
  id: number;

  name: string;

  serialNumber: string;

  /** `OPERATIONAL`, `MAINTENANCE` or `OUT_OF_SERVICE`. */
  status: string;

  /** `ENVIRONMENTAL_DEVICE` or `CONTAINER_MONITOR` for IoT devices; null for process equipment. */
  deviceType: string | null;

  environmentId: number | null;

  constructor(params: {
    id: number;
    name: string;
    serialNumber: string;
    status: string;
    deviceType: string | null;
    environmentId: number | null;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.serialNumber = params.serialNumber;
    this.status = params.status;
    this.deviceType = params.deviceType;
    this.environmentId = params.environmentId;
  }

  /** Whether the equipment is an IoT device, which only monitors conditions. */
  get isIotDevice(): boolean {
    return this.deviceType !== null;
  }

  /** Whether the equipment can be used now. */
  get isOperational(): boolean {
    return this.status === 'OPERATIONAL';
  }

  /** Whether the equipment monitors a container where batches are stored. */
  get isContainerMonitor(): boolean {
    return this.deviceType === 'CONTAINER_MONITOR';
  }
}
