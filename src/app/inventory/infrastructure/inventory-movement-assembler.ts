
import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { InventoryMovement } from '../domain/model/inventory-movement.entity';
import {
  InventoryMovementResource,
  InventoryMovementsResponse,
} from './inventory-movement-response';

/**
 * Assembler for converting between inventory movement domain
 * entities and infrastructure resources.
 *
 * @remarks
 * In Domain-Driven Design, this assembler is responsible
 * for transforming between:
 * - {@link InventoryMovement} - Domain entity representing
 *   a recorded inventory operation.
 * - {@link InventoryMovementResource} - Infrastructure
 *   resource used for API communication.
 * - {@link InventoryMovementsResponse} - API response
 *   containing a collection of inventory movements.
 *
 * This assembler maps movement identification, quantities,
 * stock levels, status transitions, and related information
 * between domain entities and API resources.
 *
 * It ensures that the domain layer remains decoupled from
 * infrastructure concerns such as API response structures
 * and serialization details.
 */
export class InventoryMovementAssembler implements BaseAssembler<
  InventoryMovement,
  InventoryMovementResource,
  InventoryMovementsResponse
> {
  /**
   * Converts an inventory movement resource into a domain entity.
   *
   * @param resource - The InventoryMovementResource to convert.
   * @returns A new InventoryMovement domain entity.
   *
   * @remarks
   * Maps the resource properties directly to a new
   * InventoryMovement instance, including movement identifiers,
   * type, quantity, measurement unit, stock levels,
   * status transitions, reason, actor, and occurrence date.
   *
   * This conversion preserves the values supplied by
   * the backend without performing stock calculations
   * or modifying the movement information.
   */
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

  /**
   * Converts an inventory movement domain entity
   * into an infrastructure resource.
   *
   * @param entity - The InventoryMovement domain entity to convert.
   * @returns An InventoryMovementResource suitable for API communication.
   *
   * @remarks
   * Extracts the properties of the domain entity and
   * maps them to the corresponding resource structure.
   *
   * The conversion includes movement identifiers,
   * quantities, stock values, status information,
   * and the responsible actor.
   *
   * No business calculations or additional transformations
   * are performed during this mapping.
   */
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

  /**
   * Converts an API response containing inventory movements
   * into an array of domain entities.
   *
   * @param response - The API response containing inventory movement resources.
   * @returns An array of InventoryMovement domain entities.
   *
   * @remarks
   * Extracts the movements collection from the
   * InventoryMovementsResponse and converts each resource
   * into an InventoryMovement entity using
   * the toEntityFromResource method.
   *
   * If the response contains an empty movements collection,
   * the method returns an empty array.
   */
  toEntitiesFromResponse(response: InventoryMovementsResponse): InventoryMovement[] {
    return response.movements.map((resource) => this.toEntityFromResource(resource));
  }
}

