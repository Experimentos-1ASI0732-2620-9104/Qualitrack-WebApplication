import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit } from '../domain/model/raw-material.entity';
import { RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';

export interface RawMaterialBatchResource extends BaseResource {
  id: number;
  laboratoryId: number;
  rawMaterialId: number;
  supplier: string;
  batchNumber: string;
  unit: InventoryUnit;
  initialAmount: number;
  availableAmount: number;
  receivedOn: string;
  expiresOn: string;
  status: RawMaterialBatchStatus;
  usable?: boolean;
  availability?: string;
}
export interface RawMaterialBatchesResponse extends BaseResponse {
  rawMaterialBatches: RawMaterialBatchResource[];
}
