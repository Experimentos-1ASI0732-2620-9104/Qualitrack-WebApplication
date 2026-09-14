import { InventoryUnit } from './raw-material.entity';
export interface SaveRawMaterialCommand {
  code: string;
  name: string;
  unit: InventoryUnit;
  minimumStock: number;
}
