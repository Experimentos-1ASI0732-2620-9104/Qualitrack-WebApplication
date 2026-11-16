import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Environment of the laboratory where Product Batch Management works: production areas, raw material storage
 * and product storage.
 *
 * @remarks
 * Laboratory Management keeps the physical spaces; Product Batch Management only keeps the reference it shows and selects
 * (Customer/Supplier relation Laboratory → Product Batch).
 */
export class ProductionEnvironment implements BaseEntity {
  id: number;

  code: string;

  name: string;

  /** Usage assigned by Laboratory Management, such as `RAW_MATERIAL_STORAGE`; null when it has none. */
  usage: string | null;

  constructor(params: { id: number; code: string; name: string; usage: string | null }) {
    this.id = params.id;
    this.code = params.code;
    this.name = params.name;
    this.usage = params.usage;
  }
}
