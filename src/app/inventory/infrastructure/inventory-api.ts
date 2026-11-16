import { LegacyMaterialSnapshotApiEndpoint } from './legacy-material-snapshot-api-endpoint';
import { ConsumingBatchApiEndpoint } from './consuming-batch-api-endpoint';
import { MaterialConsumptionApiEndpoint } from './material-consumption-api-endpoint';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { RawMaterialApiEndpoint } from './raw-material-api-endpoint';
import { RawMaterialBatchApiEndpoint } from './raw-material-batch-api-endpoint';
import { InventoryMovementApiEndpoint } from './inventory-movement-api-endpoint';
import { LegacyInventoryApiEndpoint } from './legacy-inventory-api-endpoint';
import { StorageContainerApiEndpoint } from './storage-container-api-endpoint';
import { StorageEnvironmentApiEndpoint } from './storage-environment-api-endpoint';
import { SaveRawMaterialRequest } from './raw-material.request';
import { ReceiveRawMaterialBatchRequest } from './raw-material-batch.request';
import { ExpirationStatus, RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';
import { StockStatus } from '../domain/model/raw-material.entity';

/**
 * Infrastructure service facade for inventory API operations.
 *
 * @remarks
 * In Domain-Driven Design, this facade centralizes access to
 * inventory HTTP endpoints, including raw materials, batches,
 * inventory movements, and legacy materials.
 *
 * It abstracts endpoint communication from application stores
 * and scopes inventory operations to laboratory environments.
 */
@Injectable({ providedIn: 'root' })
export class InventoryApi extends BaseApi {
  /**
   * Endpoint client for raw material operations.
   *
   * @private
   */
  private readonly materialEndpoint: RawMaterialApiEndpoint;

  /**
   * Endpoint client for raw material batch operations.
   *
   * @private
   */
  private readonly receiptEndpoint: RawMaterialBatchApiEndpoint;

  /**
   * Endpoint client for inventory movement queries.
   *
   * @private
   */
  private readonly movementEndpoint: InventoryMovementApiEndpoint;

  /**
   * Endpoint client for legacy inventory operations.
   *
   * @private
   */
  private readonly legacyEndpoint: LegacyInventoryApiEndpoint;

  /**
   * Endpoint client for retrieving legacy raw material snapshots.
   *
   * @private
   */
  private readonly legacySnapshotEndpoint: LegacyMaterialSnapshotApiEndpoint;

  /**
   * Endpoint client for retrieving production batches
   * associated with raw material consumption.
   *
   * @private
   */
  private readonly consumingBatchEndpoint: ConsumingBatchApiEndpoint;

  /**
   * Endpoint client for retrieving material consumption records
   * and their stock traceability information.
   *
   * @private
   */
  private readonly consumptionEndpoint: MaterialConsumptionApiEndpoint;

  /** Reads the container monitors of Equipment Management where lots are stored. */
  private readonly containerEndpoint: StorageContainerApiEndpoint;

  /** Reads the environments of Laboratory Management where raw materials are kept. */
  private readonly environmentEndpoint: StorageEnvironmentApiEndpoint;

  /**
   * Creates an instance of InventoryApi.
   *
   * @param http - Angular HttpClient for making HTTP requests.
   *
   * @remarks
   * Initializes the endpoint clients responsible for raw materials,
   * batches, movements, and legacy inventory operations.
   */
  constructor(http: HttpClient) {
    super();
    this.legacySnapshotEndpoint = new LegacyMaterialSnapshotApiEndpoint(http);
    this.consumingBatchEndpoint = new ConsumingBatchApiEndpoint(http);
    this.consumptionEndpoint = new MaterialConsumptionApiEndpoint(http);
    this.materialEndpoint = new RawMaterialApiEndpoint(http);
    this.receiptEndpoint = new RawMaterialBatchApiEndpoint(http);
    this.movementEndpoint = new InventoryMovementApiEndpoint(http);
    this.legacyEndpoint = new LegacyInventoryApiEndpoint(http);
    this.containerEndpoint = new StorageContainerApiEndpoint(http);
    this.environmentEndpoint = new StorageEnvironmentApiEndpoint(http);
  }

  /** All pre-Inventory materials, including those already imported. */
  legacyMaterialSnapshots(laboratoryId: number) {
    return this.legacySnapshotEndpoint.getByLaboratory(laboratoryId);
  }

  /** Production batch labels for historical consumption. */
  consumingBatches(laboratoryId: number) {
    return this.consumingBatchEndpoint.getByLaboratory(laboratoryId);
  }

  /** Production batches that consumed an Inventory material. */
  materialConsumptions(laboratoryId: number, environmentId: number, rawMaterialId: number) {
    return this.consumptionEndpoint.getByEnvironmentMaterial(laboratoryId, environmentId, rawMaterialId);
  }

  /** Historical consumption of a pre-Inventory material. */
  legacyMaterialConsumptions(laboratoryId: number, legacyId: number) {
    return this.consumptionEndpoint.getByLegacyMaterial(laboratoryId, legacyId);
  }

  /** Environments of the laboratory where raw materials can be kept. */
  environments(lab: number) {
    return this.environmentEndpoint.getEnvironments(lab);
  }

  /** One environment of the laboratory, with its usage. */
  environment(lab: number, environmentId: number) {
    return this.environmentEndpoint.getEnvironment(lab, environmentId);
  }

  /**
   * Retrieves raw materials registered in a laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param stockStatus - Optional stock classification filter.
   * @returns An Observable emitting an array of RawMaterial entities.
   *
   * @remarks
   * Delegates the query to {@link RawMaterialApiEndpoint},
   * optionally filtering materials by their stock status.
   */
  materials(lab: number, environmentId: number, stockStatus?: StockStatus) {
    return this.materialEndpoint.getByEnvironment(lab, environmentId, stockStatus);
  }

  /**
   * Retrieves a specific raw material by its identifier.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param id - Unique identifier of the raw material.
   * @returns An Observable emitting the requested RawMaterial entity.
   */
  material(lab: number, environmentId: number, id: number) {
    return this.materialEndpoint.getRawMaterial(lab, environmentId, id);
  }

  /**
   * Creates or updates a raw material in a laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param request - Raw material data to save.
   * @param id - Optional identifier of the raw material to update.
   * @returns An Observable emitting the saved RawMaterial entity.
   *
   * @remarks
   * Delegates the operation to {@link RawMaterialApiEndpoint},
   * which selects POST or PUT based on the provided identifier.
   */
  save(lab: number, environmentId: number, request: SaveRawMaterialRequest, id?: number) {
    return this.materialEndpoint.saveMaterial(lab, environmentId, request, id);
  }

  /**
   * Retrieves batches associated with a specific raw material.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the raw material.
   * @param usable - Optional flag to filter usable batches.
   * @returns An Observable emitting an array of RawMaterialBatch entities.
   *
   * @remarks
   * When usable is true, only released, unexpired batches
   * with available stock are requested from the backend.
   */
  receipts(lab: number, environmentId: number, material: number, usable?: boolean) {
    return this.receiptEndpoint.getByMaterial(lab, environmentId, material, usable);
  }

  /**
   * Retrieves raw material batches from a laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param expirationStatus - Optional expiration classification filter.
   * @param withinDays - Optional expiration period in days.
   * @returns An Observable emitting an array of RawMaterialBatch entities.
   *
   * @remarks
   * Delegates the query to {@link RawMaterialBatchApiEndpoint},
   * supporting optional expiration-based filtering.
   */
  environmentReceipts(lab: number, environmentId: number, expirationStatus?: ExpirationStatus, withinDays?: number) {
    return this.receiptEndpoint.getByEnvironment(lab, environmentId, expirationStatus, withinDays);
  }

  /**
   * Registers the receipt of a new raw material batch.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the associated raw material.
   * @param request - Batch receipt information to register.
   * @returns An Observable emitting the registered RawMaterialBatch entity.
   *
   * @remarks
   * Delegates batch registration to {@link RawMaterialBatchApiEndpoint}.
   */
  receive(lab: number, environmentId: number, material: number, request: ReceiveRawMaterialBatchRequest) {
    return this.receiptEndpoint.receive(lab, environmentId, material, request);
  }

  /**
   * Registers a review of an existing raw material batch.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the associated raw material.
   * @param receipt - Unique identifier of the batch to review.
   * @param status - Status assigned to the batch after the review.
   * @param reason - Justification for the review decision.
   * @returns An Observable emitting the RawMaterialBatchReviewResource.
   *
   * @remarks
   * Delegates the review to {@link RawMaterialBatchApiEndpoint},
   * passing the resulting status and reason in the request body.
   */
  review(lab: number, environmentId: number, material: number, receipt: number, status: RawMaterialBatchStatus, reason: string) {
    return this.receiptEndpoint.review(lab, environmentId, material, receipt, { status, reason });
  }

  /**
   * Assigns a container monitor to a raw material batch.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the associated raw material.
   * @param receipt - Unique identifier of the batch to assign.
   * @param containerMonitorId - Identifier of the container monitor.
   * @returns An Observable emitting the RawMaterialBatchContainerResource.
   *
   * @remarks
   * Delegates the container assignment to
   * {@link RawMaterialBatchApiEndpoint}, replacing the
   * previous assignment when applicable (TS29).
   */
  assignContainer(lab: number, environmentId: number, material: number, receipt: number, containerMonitorId: number) {
    return this.receiptEndpoint.assignContainer(lab, environmentId, material, receipt, { containerMonitorId });
  }

  /**
   * Retrieves the inventory movement history of a raw material.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the storage environment.
   * @param material - Unique identifier of the raw material.
   * @returns An Observable emitting an array of InventoryMovement entities.
   *
   * @remarks
   * Delegates the query to {@link InventoryMovementApiEndpoint}
   * to retrieve the recorded inventory movements.
   */
  movements(lab: number, environmentId: number, material: number) {
    return this.movementEndpoint.getByMaterial(lab, environmentId, material);
  }

  /**
   * Retrieves legacy inventory materials associated with a laboratory.
   *
   * @param lab - Unique identifier of the laboratory.
   * @returns An Observable emitting an array of LegacyMaterial objects.
   *
   * @remarks
   * Delegates the read-only query to {@link LegacyInventoryApiEndpoint}
   * to retrieve previous inventory balances.
   */
  legacy(lab: number) {
    return this.legacyEndpoint.pending(lab);
  }

  /**
   * Imports a legacy raw material into a laboratory environment.
   *
   * @param lab - Unique identifier of the laboratory.
   * @param environmentId - Identifier of the destination environment.
   * @param legacyId - Unique identifier of the legacy material to import.
   * @returns An Observable emitting the imported RawMaterialResource.
   *
   * @remarks
   * Delegates the import request to {@link LegacyInventoryApiEndpoint},
   * transferring the selected legacy material into the current inventory.
   */
  import(lab: number, environmentId: number, legacyId: number) {
    return this.legacyEndpoint.importMaterial(lab, environmentId, legacyId);
  }

  /** Containers of an environment where its lots can be stored. */
  containers(lab: number, environmentId: number) {
    return this.containerEndpoint.getContainers(lab, environmentId);
  }

  /** Laboratory-wide catalogue used by product batch consumption and the dashboard (deprecated backend read). */
}
