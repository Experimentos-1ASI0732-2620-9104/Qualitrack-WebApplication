import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Raw material of a storage environment that a production batch can consume.
 *
 * @remarks
 * Inventory Management is the owner of the raw material and its stock; Product Batch Management only keeps what
 * the consumption form shows (Customer/Supplier relation Inventory → Product Batch; the backend reads it through
 * `BatchExternalInventoryService`).
 */
export class ConsumableRawMaterial implements BaseEntity {
  id: number;

  name: string;

  /** Unit in which the stock is kept, for example `kg` or `units`. */
  unit: string;

  /** Stock of released lots that are not expired. */
  usableStock: number;

  constructor(params: { id: number; name: string; unit: string; usableStock: number }) {
    this.id = params.id;
    this.name = params.name;
    this.unit = params.unit;
    this.usableStock = params.usableStock;
  }
}
