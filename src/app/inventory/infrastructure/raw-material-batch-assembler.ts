import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import {
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
} from './raw-material-batch-response';

export class RawMaterialBatchAssembler implements BaseAssembler<
  RawMaterialBatch,
  RawMaterialBatchResource,
  RawMaterialBatchesResponse
> {
  toEntityFromResource(resource: RawMaterialBatchResource): RawMaterialBatch {
    return new RawMaterialBatch({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      rawMaterialId: resource.rawMaterialId,
      supplier: resource.supplier,
      batchNumber: resource.batchNumber,
      unit: resource.unit,
      initialAmount: resource.initialAmount,
      availableAmount: resource.availableAmount,
      receivedOn: resource.receivedOn,
      expiresOn: resource.expiresOn,
      status: resource.status,
      usable: resource.usable,
      availability: resource.availability,
    });
  }
  toResourceFromEntity(entity: RawMaterialBatch): RawMaterialBatchResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      rawMaterialId: entity.rawMaterialId,
      supplier: entity.supplier,
      batchNumber: entity.batchNumber,
      unit: entity.unit,
      initialAmount: entity.initialAmount,
      availableAmount: entity.availableAmount,
      receivedOn: entity.receivedOn,
      expiresOn: entity.expiresOn,
      status: entity.status,
      usable: entity.usable,
      availability: entity.availability,
    };
  }
  toEntitiesFromResponse(response: RawMaterialBatchesResponse): RawMaterialBatch[] {
    return response.rawMaterialBatches.map((resource) => this.toEntityFromResource(resource));
  }
}
