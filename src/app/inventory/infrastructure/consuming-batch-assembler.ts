import { ConsumingBatch } from '../domain/model/consuming-batch.entity';
import { ConsumingBatchResource } from './consuming-batch-response';

/** Translates batch labels into Inventory's own model. */
export class ConsumingBatchAssembler {
  toEntityFromResource(resource: ConsumingBatchResource): ConsumingBatch {
    return new ConsumingBatch({ id: resource.id, batchNumber: resource.batchNumber });
  }
}
