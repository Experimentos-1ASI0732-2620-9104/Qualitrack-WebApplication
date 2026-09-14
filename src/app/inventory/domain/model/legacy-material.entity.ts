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
