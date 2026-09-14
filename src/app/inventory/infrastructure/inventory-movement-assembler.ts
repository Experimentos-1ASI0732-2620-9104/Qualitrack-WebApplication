import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { InventoryMovement } from '../domain/model/inventory-movement.entity';
import {
  InventoryMovementResource,
  InventoryMovementsResponse,
} from './inventory-movement-response';

export class InventoryMovementAssembler implements BaseAssembler<
  InventoryMovement,
  InventoryMovementResource,
  InventoryMovementsResponse
> {
  toEntityFromResource(resource: InventoryMovementResource): InventoryMovement {
    return new InventoryMovement({
      id: resource.id,
      materialId: resource.materialId,
      receiptId: resource.receiptId,
      productBatchId: resource.productBatchId,
      type: resource.type,
      amount: resource.amount,
      unit: resource.unit,
      stockBefore: resource.stockBefore,
      stockAfter: resource.stockAfter,
      statusBefore: resource.statusBefore,
      statusAfter: resource.statusAfter,
      reason: resource.reason,
      actorId: resource.actorId,
      occurredAt: resource.occurredAt,
    });
  }
  toResourceFromEntity(entity: InventoryMovement): InventoryMovementResource {
    return {
      id: entity.id,
      materialId: entity.materialId,
      receiptId: entity.receiptId,
      productBatchId: entity.productBatchId,
      type: entity.type,
      amount: entity.amount,
      unit: entity.unit,
      stockBefore: entity.stockBefore,
      stockAfter: entity.stockAfter,
      statusBefore: entity.statusBefore,
      statusAfter: entity.statusAfter,
      reason: entity.reason,
      actorId: entity.actorId,
      occurredAt: entity.occurredAt,
    };
  }
  toEntitiesFromResponse(response: InventoryMovementsResponse): InventoryMovement[] {
    return response.movements.map((resource) => this.toEntityFromResource(resource));
  }
}
