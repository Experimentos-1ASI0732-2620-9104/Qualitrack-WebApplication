import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Batch } from '../domain/model/batch.entity';
import { BatchResource, BatchesResponse } from './batch-response';

/**
 * Assembler for converting between Batch domain entities and infrastructure resources.
 *
 * @remarks
 * In Domain-Driven Design (DDD), this assembler is responsible for transforming between:
 * - {@link Batch} - The core domain entity encapsulating manufacturing business logic and state.
 * - {@link BatchResource} - The infrastructure resource used for API communication.
 * - {@link BatchesResponse} - The response envelope for batch collection queries.
 *
 * This pattern ensures the domain layer remains strictly decoupled from external infrastructure concerns,
 * such as API payload structures, serialization details, and external data contracts.
 *
 * @example
 * ```typescript
 * const assembler = new BatchAssembler();
 *
 * // From API response to domain entities
 * const batches = assembler.toEntitiesFromResponse(apiResponse);
 *
 * // From domain entity to API resource
 * const resource = assembler.toResourceFromEntity(batchEntity);
 *
 ```
 *
 * @author Qualitrack
 */
export class BatchAssembler implements BaseAssembler<Batch, BatchResource, BatchesResponse> {
  /**
   * Converts a collection response envelope into an array of Batch domain entities.
   *
   * @param response - The API response containing the collection of batch resources
   * @returns An array of Batch domain entities
   *
   * @remarks
   * Extracts the batches array from the response envelope and safely converts
   * each infrastructure resource into a fully validated domain Batch entity.
   */
  toEntitiesFromResponse(response: BatchesResponse): Batch[] {
    return response.batches.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a raw infrastructure resource into a Batch domain entity.
   *
   * @param resource - The BatchResource payload to convert
   * @returns A newly reconstituted Batch domain entity
   *
   * @remarks
   * Maps resource properties directly to entity properties, ensuring the returned entity
   * is in a valid state and ready to execute business logic within the application domain.
   */
  toEntityFromResource(resource: BatchResource): Batch {
    return new Batch({
      id: resource.id,
      labId: resource.labId,
      productId: resource.productId,
      productName: resource.productName,
      batchNumber: resource.batchNumber,
      quantity: resource.quantity,
      unit: resource.unit,
      status: resource.status as any,
      startDate: resource.startDate,
      endDate: resource.endDate,
      notes: resource.notes,
      createdAt: resource.createdAt ?? ''
    });
  }

  /**
   * Converts a Batch domain entity into an infrastructure resource.
   *
   * @param entity - The Batch domain entity to serialize
   * @returns A new BatchResource suitable for API communication
   *
   * @remarks
   * Extracts only the state data required for external API serialization,
   * intentionally stripping away any internal domain logic, behaviors, or transient properties.
   */
  toResourceFromEntity(entity: Batch): BatchResource {
    return {
      id: entity.id,
      labId: entity.labId,
      productId: entity.productId,
      productName: entity.productName,
      batchNumber: entity.batchNumber,
      quantity: entity.quantity,
      unit: entity.unit,
      status: entity.status,
      startDate: entity.startDate,
      endDate: entity.endDate,
      notes: entity.notes,
      createdAt: entity.createdAt,
    } as BatchResource;
  }
}
