export { RawMaterial as InventoryMaterial } from './raw-material.entity';
export { InventoryMovement } from './inventory-movement.entity';
export type { SaveRawMaterialCommand as MaterialInput } from './save-raw-material.command';
export type { ReceiveRawMaterialBatchCommand as ReceiptInput } from './receive-raw-material-batch.command';
import { BaseEntity } from '../../../shared/domain/model/base-entity';
export interface LegacyMaterial extends BaseEntity {
  id: number;
  code: string;
  name: string;
  unit: string;
  balance: number;
  supplier: string;
  batchNumber: string;
  expiresOn: string;
}
