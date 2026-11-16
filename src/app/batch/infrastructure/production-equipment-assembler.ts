import { ProductionEquipment } from '../domain/model/production-equipment.entity';
import { ProductionEquipmentResource } from './production-equipment-response';

/**
 * Translates the equipment of Equipment Management into the equipment that Product Batch Management uses.
 */
export class ProductionEquipmentAssembler {
  toEntityFromResource(resource: ProductionEquipmentResource): ProductionEquipment {
    return new ProductionEquipment({
      id: resource.id,
      name: resource.name,
      serialNumber: resource.serialNumber,
      status: resource.status,
      deviceType: resource.deviceType,
      environmentId: resource.environmentId,
    });
  }
}
