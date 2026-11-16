import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Production batch counted and listed by the operational overview.
 *
 * @remarks
 * Product Batch Management is the owner of the batch; Reporting & Audit keeps its number, product, status and the
 * path that opens it.
 */
export class OverviewBatch implements BaseEntity {
  id: number;

  batchNumber: string;

  productName: string;

  /** `PENDING`, `IN_PROGRESS`, `RELEASED` or `REJECTED`. */
  status: string;

  environmentId: number | null;

  productId: number;

  constructor(params: {
    id: number;
    batchNumber: string;
    productName: string;
    status: string;
    environmentId: number | null;
    productId: number;
  }) {
    this.id = params.id;
    this.batchNumber = params.batchNumber;
    this.productName = params.productName;
    this.status = params.status;
    this.environmentId = params.environmentId;
    this.productId = params.productId;
  }

  /** Route of the batch detail, or null for batches registered without an environment. */
  get detailLink(): (string | number)[] | null {
    return this.environmentId === null
      ? null
      : ['/batches/environments', this.environmentId, 'products', this.productId, 'batches', this.id];
  }
}
