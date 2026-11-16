import { BaseEntity } from '../../../shared/domain/model/base-entity';

/** Read-only snapshot of a pre-Inventory material, including records already imported into Inventory. */
export class LegacyMaterialSnapshot implements BaseEntity {
  id: number;
  name: string;
  code: string;
  supplier: string;
  batchNumber: string;
  expirationDate: string;
  quantityInStock: number;
  unit: string;
  minimumStock: number;

  constructor(params: { id: number; name: string; code: string; supplier: string; batchNumber: string; expirationDate: string; quantityInStock: number; unit: string; minimumStock: number }) {
    this.id = params.id;
    this.name = params.name;
    this.code = params.code;
    this.supplier = params.supplier;
    this.batchNumber = params.batchNumber;
    this.expirationDate = params.expirationDate;
    this.quantityInStock = params.quantityInStock;
    this.unit = params.unit;
    this.minimumStock = params.minimumStock;
  }
}
