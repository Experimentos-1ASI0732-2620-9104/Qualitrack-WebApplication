import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit } from '../domain/model/raw-material.entity';

export interface RawMaterialResource extends BaseResource {
  id: number;
  laboratoryId: number;
  code: string;
  name: string;
  unit: InventoryUnit;
  minimumStock: number;
  usableStock: number;
  physicalStock: number;
  legacyId: number | null;
}
export interface RawMaterialsResponse extends BaseResponse {
  rawMaterials: RawMaterialResource[];
}
