import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Usable lot of a raw material (released, not expired and with stock) that a production batch can consume.
 *
 * @remarks
 * Inventory Management is the owner of the lot; Product Batch Management only keeps what it needs to choose the
 * lot and register the consumption (Customer/Supplier relation Inventory → Product Batch).
 */
export class ConsumableLot implements BaseEntity {
  id: number;

  rawMaterialId: number;

  /** Lot number given by the supplier. */
  batchNumber: string;

  unit: string;

  /** Stock left in the lot, in its unit. */
  availableAmount: number;

  /** Expiration date (`YYYY-MM-DD`). */
  expiresOn: string;

  constructor(params: {
    id: number;
    rawMaterialId: number;
    batchNumber: string;
    unit: string;
    availableAmount: number;
    expiresOn: string;
  }) {
    this.id = params.id;
    this.rawMaterialId = params.rawMaterialId;
    this.batchNumber = params.batchNumber;
    this.unit = params.unit;
    this.availableAmount = params.availableAmount;
    this.expiresOn = params.expiresOn;
  }
}
