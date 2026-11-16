import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Raw material counted by the operational overview when its usable stock is low.
 *
 * @remarks
 * Inventory Management classifies the stock of each material (TS27); Reporting & Audit only reads that status.
 */
export class OverviewRawMaterial implements BaseEntity {
  id: number;

  name: string;

  /** `LOW`, `OK` or another status that Inventory Management assigns. */
  stockStatus: string;

  constructor(params: { id: number; name: string; stockStatus: string }) {
    this.id = params.id;
    this.name = params.name;
    this.stockStatus = params.stockStatus;
  }

  /** Whether the usable stock is below the minimum. */
  get isLowStock(): boolean {
    return this.stockStatus === 'LOW';
  }
}
