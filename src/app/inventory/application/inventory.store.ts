import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../shared/infrastructure/api-error';
import { firstValueFrom, forkJoin, Observable } from 'rxjs';
import { InventoryApi } from '../infrastructure/inventory-api';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { InventoryMovement } from '../domain/model/inventory-movement.entity';
import { LegacyMaterial } from '../domain/model/legacy-material.entity';
import { RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import { BatchApi } from '../../batch/infrastructure/batch-api';
import { RawMaterialUsage } from '../../batch/domain/model/raw-material-usage.entity';
import { IamStore } from '../../iam/application/iam.store';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../equipment/domain/model/equipment.entity';
import { LaboratoryApi } from '../../laboratory/infrastructure/laboratory-api';
import { EnvironmentUsage } from '../../laboratory/domain/model/environment-usage';
import { SaveRawMaterialCommand } from '../domain/model/save-raw-material.command';
import { ReceiveRawMaterialBatchCommand } from '../domain/model/receive-raw-material-batch.command';
import { ReviewRawMaterialBatchCommand } from '../domain/model/review-raw-material-batch.command';

/**
 * Converts inventory-related errors into application message keys.
 *
 * @param error - The error received from an API operation.
 * @returns A translation key or error description.
 *
 * @remarks
 * Handles {@link ApiError} and {@link HttpErrorResponse},
 * including connection failures and forbidden requests.
 */
export function inventoryError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'inventory.connectionError';
    if (error.status === 403) return 'inventory.forbidden';
    return error.details || error.message;
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'inventory.connectionError';
    if (error.status === 403) return 'inventory.forbidden';
    return error.error?.details || error.error?.message || 'inventory.error';
  }
  return 'inventory.error';
}

/**
 * Application service managing inventory state and operations.
 *
 * @remarks
 * In Domain-Driven Design, this store manages raw materials,
 * batches, movements, and related inventory information.
 *
 * It coordinates infrastructure services through Angular Signals.
 * Each inventory view maintains its own instance scoped to
 * the selected laboratory environment.
 */
@Injectable()
export class InventoryStore {
  /**
   * Infrastructure facade for inventory operations.
   * @private
   */
  private readonly api = inject(InventoryApi);

  /**
   * Store providing authentication and laboratory context.
   * @private
   */
  private readonly iam = inject(IamStore);

  /**
   * API service for product batches and material usage.
   * @private
   */
  private readonly batchApi = inject(BatchApi);

  /**
   * API service for equipment and container monitors.
   * @private
   */
  private readonly equipmentApi = inject(EquipmentApi);

  /**
   * API service for laboratory environment information.
   * @private
   */
  private readonly laboratoryApi = inject(LaboratoryApi);

  /**
   * Signal containing the selected storage environment identifier.
   */
  readonly environmentId = signal<number | null>(null);

  /**
   * Signal containing the raw materials of the current environment.
   */
  readonly materials = signal<RawMaterial[]>([]);

  /**
   * Signal containing raw materials classified as low stock.
   *
   * @remarks
   * Uses the stock classification supplied by the backend.
   */
  readonly lowStockMaterials = signal<RawMaterial[]>([]);

  /**
   * Signal containing the loaded raw material batches.
   */
  readonly receipts = signal<RawMaterialBatch[]>([]);

  /**
   * Signal containing batches approaching their expiration date.
   */
  readonly nearExpiry = signal<RawMaterialBatch[]>([]);

  /**
   * Signal containing inventory movements of the selected material.
   */
  readonly movements = signal<InventoryMovement[]>([]);

  /**
   * Signal containing usage records of the selected raw material.
   */
  readonly usages = signal<RawMaterialUsage[]>([]);

  /**
   * Signal containing legacy inventory materials.
   */
  readonly legacy = signal<LegacyMaterial[]>([]);

  /**
   * Signal containing historical usage records of a legacy material.
   */
  readonly legacyHistory = signal<RawMaterialUsage[]>([]);

  /**
   * Signal containing errors related to legacy material history.
   */
  readonly legacyError = signal('');

  /**
   * Signal containing container monitors assigned to the environment.
   *
   * @remarks
   * Each monitor represents a monitored storage container.
   */
  readonly containers = signal<Equipment[]>([]);

  /**
   * Signal containing the usage classification of the environment.
   */
  readonly environmentUsage = signal<EnvironmentUsage | null>(null);

  /**
   * Signal containing errors related to storage information.
   */
  readonly storageError = signal('');

  /**
   * Signal indicating whether inventory data is being loaded.
   */
  readonly loading = signal(false);

  /**
   * Signal indicating whether a write operation is in progress.
   */
  readonly saving = signal(false);

  /**
   * Signal containing the current inventory error message.
   */
  readonly error = signal('');

  /**
   * Signal containing the latest operation notification.
   */
  readonly notice = signal('');

  /**
   * Signal containing the identifier of the selected raw material.
   */
  readonly selectedId = signal<number | null>(null);

  /**
   * Computed signal containing the selected raw material.
   *
   * @remarks
   * Reactively searches the materials collection using selectedId.
   * Returns null when no matching material exists.
   */
  readonly selected = computed(
    () => this.materials().find((material) => material.id === this.selectedId()) ?? null,
  );

  /**
   * Computed signal containing the number of low-stock materials.
   *
   * @remarks
   * Counts materials classified as LOW through
   * the isLowStock domain property.
   */
  readonly lowCount = computed(() => this.materials().filter((material) => material.isLowStock).length);

  /**
   * Computed signal identifying product batches affected
   * by observed or rejected raw material batches.
   *
   * @remarks
   * Uses material usage records to identify affected product
   * batches and removes duplicate identifiers.
   */
  readonly affectedBatches = computed(() => {
    const blocked = new Set(
      this.receipts()
        .filter((receipt) => ['OBSERVED', 'REJECTED'].includes(receipt.status))
        .map((receipt) => receipt.id),
    );
    return [
      ...new Set(
        this.usages()
          .filter((usage) => usage.inventoryReceiptId !== null && blocked.has(usage.inventoryReceiptId))
          .map((usage) => usage.batchId),
      ),
    ];
  });

  /**
   * Computed signal containing operational container monitors.
   *
   * @remarks
   * Filters monitors by OPERATIONAL status.
   * The backend validates container availability.
   */
  readonly availableContainers = computed(() => this.containers().filter((container) => container.status === 'OPERATIONAL'));

  /**
   * Computed signal indicating whether the environment
   * is designated for raw material storage.
   */
  readonly storesInContainers = computed(() => this.environmentUsage() === 'RAW_MATERIAL_STORAGE');

  /**
   * Signal indicating whether the current user
   * has permission to manage quality operations.
   */
  readonly canReview = this.iam.canManageQuality;

  /**
   * Signal indicating whether the current user
   * can perform inventory operations.
   *
   * @remarks
   * Permissions allow operators and quality managers
   * to register receipts, excluding auditors.
   */
  readonly canOperate = this.iam.canOperate;

  /**
   * Counter used to identify the latest inventory loading request.
   *
   * @remarks
   * Prevents outdated asynchronous responses from
   * overwriting the state of a newer request.
   *
   * @private
   */
  private generation = 0;

  /**
   * Gets the identifier of the current laboratory.
   *
   * @returns The laboratory identifier from the IAM store.
   *
   * @remarks
   * Delegates laboratory context validation to {@link IamStore}.
   */
  get lab(): number {
    return this.iam.requireLaboratoryId();
  }

  /**
   * Gets the identifier of the selected storage environment.
   *
   * @returns The current environment identifier.
   *
   * @throws Error when no environment has been selected.
   *
   * @private
   */
  private get environment(): number {
    const environmentId = this.environmentId();
    if (environmentId === null) throw new Error('inventory.noEnvironment');
    return environmentId;
  }

  /**
   * Creates or updates a raw material.
   *
   * @param command - Raw material information to save.
   * @param id - Optional identifier of the material to update.
   * @returns A Promise indicating whether the operation succeeded.
   *
   * @remarks
   * Delegates the operation to {@link InventoryApi}
   * and processes the result through the write method.
   */
  saveMaterial(command: SaveRawMaterialCommand, id?: number) {
    return this.write(this.api.save(this.lab, this.environment, command, id));
  }

  /**
   * Registers the receipt of a new raw material batch.
   *
   * @param material - Identifier of the associated raw material.
   * @param command - Information required to register the receipt.
   * @returns A Promise indicating whether the operation succeeded.
   */
  receive(material: number, command: ReceiveRawMaterialBatchCommand) {
    return this.write(this.api.receive(this.lab, this.environment, material, command));
  }

  /**
   * Registers a review of an existing raw material batch.
   *
   * @param receipt - The raw material batch to review.
   * @param command - Review status and justification.
   * @returns A Promise indicating whether the operation succeeded.
   *
   * @remarks
   * Sends the requested batch status and review reason
   * through {@link InventoryApi}.
   */
  review(receipt: RawMaterialBatch, command: ReviewRawMaterialBatchCommand) {
    return this.write(
      this.api.review(this.lab, this.environment, receipt.rawMaterialId, receipt.id, command.status, command.reason),
    );
  }

  /**
   * Assigns a raw material batch to a container monitor.
   *
   * @param receipt - The batch to assign to a container.
   * @param containerMonitorId - Identifier of the selected monitor.
   * @returns A Promise indicating whether the assignment succeeded.
   *
   * @remarks
   * Requests the container assignment within the
   * current storage environment
   */
  assignContainer(receipt: RawMaterialBatch, containerMonitorId: number) {
    return this.write(
      this.api.assignContainer(this.lab, this.environment, receipt.rawMaterialId, receipt.id, containerMonitorId),
    );
  }

  /**
   * Retrieves the name of a container monitor.
   *
   * @param containerMonitorId - Identifier of the container monitor.
   * @returns The container name, or null if no match is found.
   *
   * @remarks
   * Searches the monitors loaded for the current environment.
   */
  containerName(containerMonitorId: number | null): string | null {
    return this.containers().find((container) => container.id === containerMonitorId)?.name ?? null;
  }

  /**
   * Imports a legacy raw material into the selected environment.
   *
   * @param legacyId - Identifier of the legacy material to import.
   * @returns A Promise indicating whether the import succeeded.
   */
  importMaterial(legacyId: number) {
    return this.write(this.api.import(this.lab, this.environment, legacyId));
  }

  /**
   * Loads inventory information for a laboratory environment.
   *
   * @param environmentId - Identifier of the environment to load.
   * @param id - Optional identifier of a raw material to select.
   * @returns A Promise resolving to true when the current request
   * successfully loads the material collection.
   *
   * @remarks
   * Loads materials and, when selected, their batches, movements,
   * usages, storage information, and legacy history.
   * Discards outdated responses using a generation counter.
   */
  async load(environmentId: number, id: number | null = null): Promise<boolean> {
    const generation = ++this.generation;
    this.environmentId.set(environmentId);
    this.selectedId.set(id);
    this.loading.set(true);
    this.error.set('');
    this.receipts.set([]);
    this.movements.set([]);
    this.usages.set([]);
    this.legacyHistory.set([]);
    this.legacyError.set('');
    this.storageError.set('');
    let materialsLoaded = false;
    try {
      const materials = await firstValueFrom(this.api.materials(this.lab, environmentId));
      if (generation !== this.generation) return false;
      this.materials.set(materials);
      materialsLoaded = true;
      if (id !== null) {
        if (!materials.some((material) => material.id === id)) throw new Error('inventory.notFound');
        const detail = await firstValueFrom(
          forkJoin({
            receipts: this.api.receipts(this.lab, environmentId, id),
            movements: this.api.movements(this.lab, environmentId, id),
            usages: this.batchApi.getRawMaterialUsages(this.lab, environmentId, id),
          }),
        );
        if (generation !== this.generation) return false;
        this.receipts.set(detail.receipts);
        this.movements.set(detail.movements);
        this.usages.set(detail.usages);
        await this.loadStorage(environmentId, generation);
        const legacyId = this.selected()?.legacyId;
        if (legacyId) {
          try {
            const history = await firstValueFrom(this.batchApi.getMaterialHistory(this.lab, legacyId));
            if (generation === this.generation) this.legacyHistory.set(history);
          } catch (error) {
            if (generation === this.generation) this.legacyError.set(inventoryError(error));
          }
        }
      }
    } catch (error) {
      if (generation === this.generation) {
        this.materials.set([]);
        this.error.set(error instanceof Error && error.message.startsWith('inventory.') ? error.message : inventoryError(error));
      }
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
    return materialsLoaded && generation === this.generation;
  }

  /**
   * Loads container monitors and usage information for an environment.
   *
   * @param environmentId - Identifier of the storage environment.
   * @param generation - Identifier of the active loading request.
   * @returns A Promise that resolves when loading finishes.
   *
   * @remarks
   * Retrieves equipment and environment information concurrently,
   * retaining only container monitors assigned to the environment
   *
   * @private
   */
  private async loadStorage(environmentId: number, generation: number): Promise<void> {
    try {
      const storage = await firstValueFrom(
        forkJoin({
          equipment: this.equipmentApi.getEquipment(this.lab),
          environment: this.laboratoryApi.getEnvironment(this.lab, environmentId),
        }),
      );
      if (generation !== this.generation) return;
      this.containers.set(
        storage.equipment.filter(
          (item) => item.deviceType === 'CONTAINER_MONITOR' && item.environmentId === environmentId,
        ),
      );
      this.environmentUsage.set(storage.environment.usage);
    } catch (error) {
      if (generation !== this.generation) return;
      this.containers.set([]);
      this.environmentUsage.set(null);
      this.storageError.set(inventoryError(error));
    }
  }

  /**
   * Loads raw materials classified as low stock.
   *
   * @returns A Promise that resolves when the operation finishes.
   *
   * @remarks
   * Requests materials classified as LOW by the backend
   * and updates the lowStockMaterials signal
   */
  async loadLowStock(): Promise<void> {
    try {
      this.lowStockMaterials.set(await firstValueFrom(this.api.materials(this.lab, this.environment, 'LOW')));
    } catch (error) {
      this.error.set(inventoryError(error));
    }
  }

  /**
   * Loads raw material batches approaching expiration.
   *
   * @param withinDays - Optional number of days for expiration filtering.
   * @returns A Promise that resolves when the operation finishes.
   *
   * @remarks
   * Requests batches classified as NEAR_EXPIRY
   * and updates the nearExpiry signal.
   */
  async loadNearExpiry(withinDays?: number): Promise<void> {
    try {
      this.nearExpiry.set(
        await firstValueFrom(this.api.environmentReceipts(this.lab, this.environment, 'NEAR_EXPIRY', withinDays)),
      );
    } catch (error) {
      this.error.set(inventoryError(error));
    }
  }

  /**
   * Loads the legacy inventory materials of the current laboratory.
   *
   * @returns A Promise that resolves when the operation finishes.
   *
   * @remarks
   * Retrieves legacy materials through {@link InventoryApi}
   * and updates the legacy signal.
   */
  async loadLegacy(): Promise<void> {
    this.error.set('');
    try {
      this.legacy.set(await firstValueFrom(this.api.legacy(this.lab)));
    } catch (error) {
      this.error.set(inventoryError(error));
    }
  }

  /**
   * Executes an inventory write operation and updates store state.
   *
   * @param request - Observable representing the API write operation.
   * @returns A Promise resolving to true on successful completion,
   * or false if the operation fails or another write is in progress.
   *
   * @remarks
   * Prevents concurrent writes, manages saving and error states,
   * and reloads inventory information after a successful request.
   *
   * @private
   */
  private async write(request: Observable<unknown>): Promise<boolean> {
    if (this.saving()) return false;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await firstValueFrom(request);
      this.notice.set('inventory.saved');
      await this.load(this.environment, this.selectedId());
      return true;
    } catch (error) {
      this.error.set(inventoryError(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
