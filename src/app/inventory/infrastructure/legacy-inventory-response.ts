import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
export interface LegacyMaterialResource extends BaseResource {
  id: number;
  code: string;
  name: string;
  unit: string;
  balance: number;
  supplier: string;
  batchNumber: string;
  expiresOn: string;
}
export interface LegacyImportResponse extends BaseResponse {
  materialId: number;
}
