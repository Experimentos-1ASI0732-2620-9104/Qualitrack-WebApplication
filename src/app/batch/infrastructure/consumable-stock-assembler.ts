import { ConsumableLot } from '../domain/model/consumable-lot.entity';
import { ConsumableRawMaterial } from '../domain/model/consumable-raw-material.entity';
import { ConsumableLotResource, ConsumableRawMaterialResource } from './consumable-stock-response';

/**
 * Translates the raw materials and lots of Inventory Management into what a production batch can consume.
 */
export class ConsumableStockAssembler {
  toRawMaterial(resource: ConsumableRawMaterialResource): ConsumableRawMaterial {
    return new ConsumableRawMaterial({
      id: resource.id,
      name: resource.name,
      unit: resource.unit,
      usableStock: resource.usableStock,
    });
  }

  toLot(resource: ConsumableLotResource): ConsumableLot {
    return new ConsumableLot({
      id: resource.id,
      rawMaterialId: resource.rawMaterialId,
      batchNumber: resource.batchNumber,
      unit: resource.unit,
      availableAmount: resource.availableAmount,
      expiresOn: resource.expiresOn,
    });
  }
}
