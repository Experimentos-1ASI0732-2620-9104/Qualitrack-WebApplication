import { InventoryUnit } from '../domain/model/raw-material.entity';
export interface SaveRawMaterialRequest {
  code: string;
  name: string;
  unit: InventoryUnit;
  minimumStock: number;
}
