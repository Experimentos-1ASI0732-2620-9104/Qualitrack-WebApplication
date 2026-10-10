import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import {
  Batch,
  BatchStatus
} from '../domain/model/batch.entity';
import { BatchTraceability } from '../domain/model/batch-traceability.entity';
import {
  BatchesResponse,
  BatchResource,
  BatchTraceabilityResource
} from './batch-response';

/**
 * Maps product batches and their traceability between API resources and domain models.
 *
 * @remarks
 * Besides the standard assembler operations, it converts the traceability read model returned by
 * GET .../batches/{batchId}/traceability.
 *
 * @example
 * ```typescript
 * const assembler = new BatchAssembler();
 *
 * // Mapping from an API resource to a domain entity
 * const batch = assembler.toEntityFromResource(resource);
 *
 * // Mapping the traceability of a batch
 * const traceability = assembler.toTraceabilityFromResource(traceabilityResource);
 * ```
 *
 * @author Qualitrack
 */
export class BatchAssembler implements BaseAssembler<
  Batch,
  BatchResource,
  BatchesResponse
> {
  /**
   * Converts a batch collection response into an array of domain entities.
   *
   * @param response - The API response envelope containing the batch resources.
   * @returns An array of Batch entities.
   */
  toEntitiesFromResponse(response: BatchesResponse): Batch[] {
    return response.batches.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a batch resource into a domain entity.
   *
   * @param resource - The API resource.
   * @returns The Batch entity; a missing environment becomes null and a null end date or notes become undefined.
   */
  toEntityFromResource(resource: BatchResource): Batch {
    return new Batch({
      id: resource.id,
      labId: resource.labId,
      environmentId: resource.environmentId ?? null,
      productId: resource.productId,
      productName: resource.productName,
      batchNumber: resource.batchNumber,
      quantity: resource.quantity,
      unit: resource.unit,
      status: resource.status as BatchStatus,
      startDate: resource.startDate,
      endDate: resource.endDate ?? undefined,
      notes: resource.notes ?? undefined,
      containerMonitorId: resource.containerMonitorId,
    });
  }

  /**
   * Converts a domain entity into a batch resource.
   *
   * @param entity - The Batch entity.
   * @returns A plain object following the BatchResource contract.
   */
  toResourceFromEntity(entity: Batch): BatchResource {
    return {
      id: entity.id,
      labId: entity.labId,
      environmentId: entity.environmentId,
      productId: entity.productId,
      productName: entity.productName,
      batchNumber: entity.batchNumber,
      quantity: entity.quantity,
      unit: entity.unit,
      status: entity.status,
      startDate: entity.startDate,
      endDate: entity.endDate,
      notes: entity.notes,
      containerMonitorId: entity.containerMonitorId,
    };
  }

  /**
   * Converts the traceability resource of a batch into its domain model.
   *
   * @param resource - The traceability resource returned by the API.
   * @returns The BatchTraceability; the batch is mapped to an entity and a missing container becomes null.
   */
  toTraceabilityFromResource(resource: BatchTraceabilityResource): BatchTraceability {
    return {
      batch: this.toEntityFromResource(resource.batch),
      product: resource.product,
      rawMaterials: resource.rawMaterials,
      equipment: resource.equipment,
      staff: resource.staff,
      release: resource.release,
      rejection: resource.rejection,
      container: resource.container ?? null,
    };
  }
}
