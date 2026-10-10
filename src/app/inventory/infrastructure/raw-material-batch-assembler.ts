import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import {
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
} from './raw-material-batch-response';

/**
 * Assembler for converting between RawMaterialBatch domain entities
 * and infrastructure resources.
 *
 * @remarks
 * In Domain-Driven Design, this assembler is responsible
 * for transforming between:
 * - {@link RawMaterialBatch} - Domain entity representing
 *   a registered raw material batch.
 * - {@link RawMaterialBatchResource} - Infrastructure resource
 *   used for API communication.
 * - {@link RawMaterialBatchesResponse} - API response containing
 *   a collection of raw material batch resources.
 *
 * This assembler maps batch identification, supplier information,
 * measurement units, inventory quantities, receipt and expiration
 * dates, operational statuses, and container monitor references
 * between domain entities and infrastructure resources.
 *
 * It helps maintain separation between the domain model and
 * infrastructure concerns such as API response formats
 * and data serialization.
 */
export class RawMaterialBatchAssembler implements BaseAssembler<
  RawMaterialBatch,
  RawMaterialBatchResource,
  RawMaterialBatchesResponse
> {
  /**
   * Converts a raw material batch resource into a domain entity.
   *
   * @param resource - The RawMaterialBatchResource to convert.
   * @returns A new RawMaterialBatch domain entity.
   *
   * @remarks
   * Maps the resource properties to a new RawMaterialBatch instance,
   * including batch identifiers, supplier information, quantities,
   * dates, operational status, and optional classifications.
   *
   * Optional usability, availability, expiration status,
   * and container monitor information are passed to the
   * domain entity when provided by the API.
   *
   * The RawMaterialBatch constructor initializes
   * containerMonitorId to null when the resource
   * provides null or undefined.
   *
   * Inventory quantities and expiration classifications
   * are preserved as supplied by the server without
   * performing additional calculations.
   */
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
      expirationStatus: resource.expirationStatus,
      containerMonitorId: resource.containerMonitorId,
    });
  }

  /**
   * Converts a raw material batch domain entity
   * into an infrastructure resource.
   *
   * @param entity - The RawMaterialBatch domain entity to convert.
   * @returns A RawMaterialBatchResource suitable for API communication.
   *
   * @remarks
   * Extracts the properties of the domain entity and
   * maps them to the corresponding resource structure.
   *
   * The conversion includes batch identifiers, supplier
   * information, inventory quantities, dates, operational
   * status, optional classifications, and container monitor data.
   *
   * No business calculations or additional transformations
   * are performed during this mapping.
   */
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
      expirationStatus: entity.expirationStatus,
      containerMonitorId: entity.containerMonitorId,
    };
  }

  /**
   * Converts an API response containing raw material batches
   * into an array of domain entities.
   *
   * @param response - The API response containing raw material batch resources.
   * @returns An array of RawMaterialBatch domain entities.
   *
   * @remarks
   * Extracts the rawMaterialBatches collection from the
   * RawMaterialBatchesResponse and converts each resource
   * into a RawMaterialBatch entity using the
   * toEntityFromResource method.
   *
   * If the response contains an empty rawMaterialBatches
   * collection, the method returns an empty array.
   */
  toEntitiesFromResponse(response: RawMaterialBatchesResponse): RawMaterialBatch[] {
    return response.rawMaterialBatches.map((resource) => this.toEntityFromResource(resource));
  }
}
