import { BaseEntity } from '../../../shared/domain/model/base-entity';
export type InventoryUnit = 'kg' | 'g' | 'L' | 'mL' | 'units';

/** Domain state, independent from HTTP resources. Stock values are supplied by the server. */
export class RawMaterial implements BaseEntity {
  readonly id: number;
  readonly laboratoryId: number;
  readonly code: string;
  readonly name: string;
  readonly unit: InventoryUnit;
  readonly minimumStock: number;
  readonly usableStock: number;
  readonly physicalStock: number;
  readonly legacyId: number | null;
  constructor(params: {
    id: number;
    laboratoryId: number;
    code: string;
    name: string;
    unit: InventoryUnit;
    minimumStock: number;
    usableStock: number;
    physicalStock: number;
    legacyId: number | null;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.code = params.code;
    this.name = params.name;
    this.unit = params.unit;
    this.minimumStock = params.minimumStock;
    this.usableStock = params.usableStock;
    this.physicalStock = params.physicalStock;
    this.legacyId = params.legacyId;
  }
}
