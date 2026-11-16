import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Container of an environment where a raw material lot can be stored, identified by its container monitor.
 *
 * @remarks
 * Equipment Management is the owner of the container monitor; Inventory Management keeps its own reference to
 * assign lots to it (the backend reads it through `InventoryExternalEquipmentService`).
 */
export class StorageContainer implements BaseEntity {
  id: number;

  name: string;

  serialNumber: string;

  /** `OPERATIONAL`, `MAINTENANCE` or `OUT_OF_SERVICE`. */
  status: string;

  environmentId: number | null;

  constructor(params: { id: number; name: string; serialNumber: string; status: string; environmentId: number | null }) {
    this.id = params.id;
    this.name = params.name;
    this.serialNumber = params.serialNumber;
    this.status = params.status;
    this.environmentId = params.environmentId;
  }
}
