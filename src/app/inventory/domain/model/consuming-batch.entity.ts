import { BaseEntity } from '../../../shared/domain/model/base-entity';

/** Production batch label used to keep historical material consumption readable in Inventory. */
export class ConsumingBatch implements BaseEntity {
  id: number;
  batchNumber: string;

  constructor(params: { id: number; batchNumber: string }) {
    this.id = params.id;
    this.batchNumber = params.batchNumber;
  }
}
