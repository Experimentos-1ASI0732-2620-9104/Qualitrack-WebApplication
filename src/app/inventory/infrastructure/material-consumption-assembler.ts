import { MaterialConsumption } from '../domain/model/material-consumption.entity';
import { MaterialConsumptionResource } from './material-consumption-response';

/** Maps consumption resources into Inventory without importing Product Batch models. */
export class MaterialConsumptionAssembler {
  toEntityFromResource(resource: MaterialConsumptionResource): MaterialConsumption {
    return new MaterialConsumption({
      id: resource.id, batchId: resource.batchId, inventoryReceiptId: resource.inventoryReceiptId,
      stockBefore: resource.stockBefore, stockAfter: resource.stockAfter,
      quantityUsed: resource.quantityUsed, unit: resource.unit, usageDate: resource.usageDate,
    });
  }
}
