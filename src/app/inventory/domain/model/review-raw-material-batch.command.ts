import { RawMaterialBatchStatus } from './raw-material-batch.entity';
export interface ReviewRawMaterialBatchCommand {
  status: RawMaterialBatchStatus;
  reason: string;
}
