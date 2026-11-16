import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Batch } from '../domain/model/batch.entity';
import {
  BatchContainer,
  BatchTraceability
} from '../domain/model/batch-traceability.entity';
import {
  EquipmentUsage,
  StaffParticipation
} from '../domain/model/batch-participation.entity';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';
import { BatchApiEndpoint } from './batch-api-endpoint';
import { BatchPath } from '../domain/model/batch-path';
import { ProductApiEndpoint } from './product-api-endpoint';
import { RawMaterialUsageApiEndpoint } from './raw-material-usage-api-endpoint';
import { ProductionEquipmentApiEndpoint } from './production-equipment-api-endpoint';
import { ProductionEquipment } from '../domain/model/production-equipment.entity';
import { ProductionEnvironmentApiEndpoint } from './production-environment-api-endpoint';
import { ProductionEnvironment } from '../domain/model/production-environment.entity';
import { ProductionStaffMemberApiEndpoint } from './production-staff-member-api-endpoint';
import { ProductionStaffMember } from '../domain/model/production-staff-member.entity';
import { ConsumableStockApiEndpoint } from './consumable-stock-api-endpoint';
import { ConsumableRawMaterial } from '../domain/model/consumable-raw-material.entity';
import { ConsumableLot } from '../domain/model/consumable-lot.entity';
import {
  CreateBatchRequest,
  RejectBatchRequest,
  ReleaseBatchRequest
} from './batch.request';
import { CreateProductRequest } from './product.request';
import { RegisterRawMaterialUsageRequest } from './raw-material-usage.request';

/**
 * Facade of the Product Batch Management API: products, batches, manufacturing records and traceability.
 *
 * @remarks
 * It groups the endpoint clients of the bounded context so that the application layer talks to a
 * single entry point. Most operations receive a {@link BatchPath} with the laboratory, environment and
 * product of the batch.
 *
 * @example
 * ```typescript
 * const batchApi = inject(BatchApi);
 *
 * const path = { laboratoryId: 1, environmentId: 3, productId: 12 };
 * batchApi.getProductBatches(path).subscribe(batches => console.log(batches));
 * ```
 *
 * @author Qualitrack
 */
@Injectable({ providedIn: 'root' })
export class BatchApi extends BaseApi {
  private readonly batchEndpoint: BatchApiEndpoint;
  private readonly productEndpoint: ProductApiEndpoint;
  private readonly usageEndpoint: RawMaterialUsageApiEndpoint;
  private readonly equipmentEndpoint: ProductionEquipmentApiEndpoint;
  private readonly environmentEndpoint: ProductionEnvironmentApiEndpoint;
  private readonly staffEndpoint: ProductionStaffMemberApiEndpoint;
  private readonly stockEndpoint: ConsumableStockApiEndpoint;

  /**
   * Creates a new BatchApi instance.
   *
   * @param http - The HTTP client for making requests.
   */
  constructor(http: HttpClient) {
    super();
    this.batchEndpoint = new BatchApiEndpoint(http);
    this.productEndpoint = new ProductApiEndpoint(http);
    this.usageEndpoint = new RawMaterialUsageApiEndpoint(http);
    this.equipmentEndpoint = new ProductionEquipmentApiEndpoint(http);
    this.environmentEndpoint = new ProductionEnvironmentApiEndpoint(http);
    this.staffEndpoint = new ProductionStaffMemberApiEndpoint(http);
    this.stockEndpoint = new ConsumableStockApiEndpoint(http);
  }

  /**
   * Retrieves the environments of a laboratory, as Product Batch Management uses them.
   *
   * @param laboratoryId - The ID of the laboratory.
   * @returns An Observable of the environments.
   */
  getEnvironments(laboratoryId: number): Observable<ProductionEnvironment[]> {
    return this.environmentEndpoint.getEnvironments(laboratoryId);
  }

  /**
   * Retrieves the staff of a laboratory, as Product Batch Management assigns them to batches.
   *
   * @param laboratoryId - The ID of the laboratory.
   * @returns An Observable of the staff members.
   */
  getStaff(laboratoryId: number): Observable<ProductionStaffMember[]> {
    return this.staffEndpoint.getStaff(laboratoryId);
  }

  /**
   * Retrieves the raw materials that a batch can consume from an environment.
   *
   * @param laboratoryId - The ID of the laboratory.
   * @param environmentId - The environment where the raw materials are kept.
   * @returns An Observable of the raw materials with their usable stock.
   */
  getConsumableRawMaterials(laboratoryId: number, environmentId: number): Observable<ConsumableRawMaterial[]> {
    return this.stockEndpoint.getRawMaterials(laboratoryId, environmentId);
  }

  /**
   * Retrieves the usable lots of a raw material: released, not expired and with stock.
   *
   * @param laboratoryId - The ID of the laboratory.
   * @param environmentId - The environment where the raw material is kept.
   * @param rawMaterialId - The ID of the raw material.
   * @returns An Observable of the lots.
   */
  getConsumableLots(laboratoryId: number, environmentId: number, rawMaterialId: number): Observable<ConsumableLot[]> {
    return this.stockEndpoint.getUsableLots(laboratoryId, environmentId, rawMaterialId);
  }

  /**
   * Retrieves the equipment and IoT devices of a laboratory, as Product Batch Management uses them.
   *
   * @param laboratoryId - The ID of the laboratory.
   * @returns An Observable of the equipment.
   */
  getProductionEquipment(laboratoryId: number): Observable<ProductionEquipment[]> {
    return this.equipmentEndpoint.getEquipment(laboratoryId);
  }

  /**
   * Retrieves the products of an environment.
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment of the products.
   * @returns An observable of an array of products.
   */
  getProducts(
    laboratoryId: number,
    environmentId: number
  ): Observable<PharmaceuticalProduct[]> {
    return this.productEndpoint.getProducts(laboratoryId, environmentId);
  }

  /**
   * Retrieves a product by its ID.
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment of the product.
   * @param productId - The ID of the product.
   * @returns An observable of the product.
   */
  getProduct(
    laboratoryId: number,
    environmentId: number,
    productId: number,
  ): Observable<PharmaceuticalProduct> {
    return this.productEndpoint.getProduct(laboratoryId, environmentId, productId);
  }

  /**
   * Registers a new product in an environment.
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment where the product will be manufactured.
   * @param request - The data of the product to register.
   * @returns An observable of the registered product.
   */
  createProduct(
    laboratoryId: number,
    environmentId: number,
    request: CreateProductRequest,
  ): Observable<PharmaceuticalProduct> {
    return this.productEndpoint.createProduct(laboratoryId, environmentId, request);
  }

  /**
   * Retrieves the batches of every product of the laboratory, used by lists and dashboards.
   *
   * @param laboratoryId - The laboratory identifier.
   * @returns An observable of an array of batches.
   */
  getBatches(laboratoryId: number): Observable<Batch[]> {
    return this.batchEndpoint.getLaboratoryBatches(laboratoryId);
  }

  /**
   * Retrieves the batches of a product.
   *
   * @param path - Laboratory, environment and product of the batches.
   * @returns An observable of an array of batches.
   */
  getProductBatches(path: BatchPath): Observable<Batch[]> {
    return this.batchEndpoint.getProductBatches(path);
  }

  /**
   * Retrieves a batch by its ID.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The ID of the batch.
   * @returns An observable of the batch.
   */
  getBatch(
    path: BatchPath,
    batchId: number
  ): Observable<Batch> {
    return this.batchEndpoint.getBatch(path, batchId);
  }

  /**
   * Registers a new batch of a product.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param request - The data of the batch to register.
   * @returns An observable of the registered batch.
   */
  createBatch(
    path: BatchPath,
    request: CreateBatchRequest
  ): Observable<Batch> {
    return this.batchEndpoint.createBatch(path, request);
  }

  /**
   * Releases a batch after a successful quality control.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The ID of the batch.
   * @param request - Release date and notes.
   * @returns An observable that emits once the batch is released.
   */
  releaseBatch(
    path: BatchPath,
    batchId: number,
    request: ReleaseBatchRequest,
  ): Observable<unknown> {
    return this.batchEndpoint.releaseBatch(path, batchId, request);
  }

  /**
   * Rejects a batch that failed the quality control.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The ID of the batch.
   * @param request - Rejection date and reason.
   * @returns An observable that emits once the batch is rejected.
   */
  rejectBatch(
    path: BatchPath,
    batchId: number,
    request: RejectBatchRequest
  ): Observable<unknown> {
    return this.batchEndpoint.rejectBatch(path, batchId, request);
  }

  /**
   * Consumes a released raw material lot for a batch.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The ID of the batch.
   * @param request - Lot, amount, unit and idempotency key.
   * @returns An observable of the recorded usage.
   */
  registerRawMaterialUsage(
    path: BatchPath,
    batchId: number,
    request: RegisterRawMaterialUsageRequest,
  ): Observable<RawMaterialUsage> {
    return this.usageEndpoint.registerUsage(path, batchId, request);
  }

  /**
   * Registers the use of equipment in a batch.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The ID of the batch.
   * @param equipmentId - The ID of the equipment used.
   * @returns An observable of the recorded usage.
   */
  registerEquipmentUsage(
    path: BatchPath,
    batchId: number,
    equipmentId: number,
  ): Observable<EquipmentUsage> {
    return this.batchEndpoint.registerEquipmentUsage(path, batchId, { equipmentId });
  }

  /**
   * Registers the participation of a staff member in a batch.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The ID of the batch.
   * @param staffId - The ID of the staff member.
   * @returns An observable of the recorded participation.
   */
  registerStaffParticipation(
    path: BatchPath,
    batchId: number,
    staffId: number,
  ): Observable<StaffParticipation> {
    return this.batchEndpoint.registerStaffParticipation(path, batchId, { staffId });
  }

  /**
   * Retrieves everything that took part in a batch.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The ID of the batch.
   * @returns An observable of the traceability of the batch.
   */
  getTraceability(path: BatchPath, batchId: number): Observable<BatchTraceability> {
    return this.batchEndpoint.getTraceability(path, batchId);
  }

  /**
   * Stores the batch in a container monitor of a product storage environment (TS68).
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The ID of the batch.
   * @param containerMonitorId - The ID of the container monitor.
   * @returns An observable of the container assignment.
   */
  assignContainer(
    path: BatchPath,
    batchId: number,
    containerMonitorId: number,
  ): Observable<BatchContainer> {
    return this.batchEndpoint.assignContainer(path, batchId, { containerMonitorId });
  }

  /**
   * Retrieves the batches that used a raw material registered before Inventory Management existed.
   *
   * @param laboratoryId - The laboratory of the material.
   * @param rawMaterialId - The ID of the legacy raw material.
   * @returns An observable of the usages of the material.
   */
  getMaterialHistory(
    laboratoryId: number,
    rawMaterialId: number
  ): Observable<RawMaterialUsage[]> {
    return this.usageEndpoint.getUsageByMaterial(laboratoryId, rawMaterialId);
  }

  /**
   * Retrieves the product batches that consumed lots of an Inventory raw material kept in an environment (TS79).
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment where the raw material is kept.
   * @param rawMaterialId - The ID of the Inventory raw material.
   * @returns An observable of the usages of the material.
   */
  getRawMaterialUsages(
    laboratoryId: number,
    environmentId: number,
    rawMaterialId: number,
  ): Observable<RawMaterialUsage[]> {
    return this.usageEndpoint.getUsageByEnvironmentMaterial(
      laboratoryId,
      environmentId,
      rawMaterialId,
    );
  }
}
