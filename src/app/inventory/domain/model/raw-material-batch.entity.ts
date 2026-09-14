import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { InventoryUnit } from './raw-material.entity';
export type RawMaterialBatchStatus = 'QUARANTINED' | 'RELEASED' | 'OBSERVED' | 'REJECTED';

/** Domain state, independent from HTTP resources. Stock values are supplied by the server. */
export class RawMaterialBatch implements BaseEntity {
  readonly id: number;
  readonly laboratoryId: number;
  readonly rawMaterialId: number;
  readonly supplier: string;
  readonly batchNumber: string;
  readonly unit: InventoryUnit;
  readonly initialAmount: number;
  readonly availableAmount: number;
  readonly receivedOn: string;
  readonly expiresOn: string;
  readonly status: RawMaterialBatchStatus;
  readonly usable?: boolean;
  readonly availability?: string;
  constructor(params: {
    id: number;
    laboratoryId: number;
    rawMaterialId: number;
    supplier: string;
    batchNumber: string;
    unit: InventoryUnit;
    initialAmount: number;
    availableAmount: number;
    receivedOn: string;
    expiresOn: string;
    status: RawMaterialBatchStatus;
    usable?: boolean;
    availability?: string;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.rawMaterialId = params.rawMaterialId;
    this.supplier = params.supplier;
    this.batchNumber = params.batchNumber;
    this.unit = params.unit;
    this.initialAmount = params.initialAmount;
    this.availableAmount = params.availableAmount;
    this.receivedOn = params.receivedOn;
    this.expiresOn = params.expiresOn;
    this.status = params.status;
    this.usable = params.usable;
    this.availability = params.availability;
  }
}
