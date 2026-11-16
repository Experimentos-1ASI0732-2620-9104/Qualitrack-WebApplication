import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LegacyMaterialSnapshot } from '../domain/model/legacy-material-snapshot.entity';
import { ConsumingBatch } from '../domain/model/consuming-batch.entity';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../shared/infrastructure/api-error';
import { firstValueFrom, forkJoin, Observable, Subject, takeUntil } from 'rxjs';
import { InventoryApi } from '../infrastructure/inventory-api';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { InventoryMovement } from '../domain/model/inventory-movement.entity';
import { LegacyMaterial } from '../domain/model/legacy-material.entity';
import { RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import { MaterialConsumption } from '../domain/model/material-consumption.entity';
import { IamStore } from '../../iam/application/iam.store';
import { StorageContainer } from '../domain/model/storage-container.entity';
import { StorageEnvironment } from '../domain/model/storage-environment.entity';
import { EnvironmentPreference } from '../../shared/infrastructure/environment-preference';
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
@Injectable({ providedIn: 'root' })
export class InventoryStore {
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadLegacyDetail = new Subject<void>();
  readonly legacyDetailMaterial = signal<LegacyMaterialSnapshot | null>(null);
  readonly legacyDetailConsumptions = signal<MaterialConsumption[]>([]);
  readonly legacyDetailBatches = signal<ConsumingBatch[]>([]);
  readonly legacyDetailLoading = signal(false);
  readonly legacyDetailError = signal<string | null>(null);
  /** Whether historical usages predate recorded stock balances. */
  readonly legacyDetailHasUnrecordedStock = computed(() =>
    this.legacyDetailConsumptions().some((usage) => usage.stockAfter === null),
  );

  /** Cancels stale history and clears the detail when its route changes or is left. */
  clearLegacyDetail(): void {
    this.reloadLegacyDetail.next();
    this.legacyDetailMaterial.set(null);
    this.legacyDetailConsumptions.set([]);
    this.legacyDetailBatches.set([]);
    this.legacyDetailLoading.set(false);
    this.legacyDetailError.set(null);
  }

  /** Loads preserved pre-Inventory material data and consumption without changing previous-balance imports. */
  loadLegacyDetail(materialId: number): void {
    this.clearLegacyDetail();
    if (!Number.isSafeInteger(materialId) || materialId <= 0) {
      this.legacyDetailError.set('material-history.not-found');
      return;
    }
    this.legacyDetailLoading.set(true);
    forkJoin({
      materials: this.api.legacyMaterialSnapshots(this.lab),
      usages: this.api.legacyMaterialConsumptions(this.lab, materialId),
      batches: this.api.consumingBatches(this.lab),
    })
      .pipe(takeUntil(this.reloadLegacyDetail), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ materials, usages, batches }) => {
          this.legacyDetailMaterial.set(
            materials.find((material) => material.id === materialId) ?? null,
          );
          this.legacyDetailConsumptions.set(usages);
          this.legacyDetailBatches.set(batches);
          if (!this.legacyDetailMaterial())
            this.legacyDetailError.set('material-history.not-found');
          this.legacyDetailLoading.set(false);
        },
        error: () => {
          this.legacyDetailError.set('material-history.load-error');
          this.legacyDetailLoading.set(false);
        },
      });
  }

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
   * Raw material storage opened last time in this browser.
   * @private
   */
  private readonly environmentPreference = new EnvironmentPreference('inventory');

  /**
   * Signal containing the environments of the laboratory where raw materials can be kept.
   */
  readonly environments = signal<StorageEnvironment[]>([]);

  /**
   * Signal indicating whether the environments have been read at least once.
   */
  readonly environmentsLoaded = signal(false);

  /**
   * Signal indicating whether the environments are being read.
   */
  readonly environmentsLoading = signal(false);

  /**
   * Signal containing the translation key of the failure to read the environments, or an empty string.
   */
  readonly environmentsError = signal('');

  /**
   * Indicates whether the laboratory has no environment yet.
   */
  readonly environmentsEmpty = computed(
    () => this.environmentsLoaded() && this.environments().length === 0,
  );

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
   * Signal indicating whether the latest low-stock request is still waiting for its answer.
   *
   * @remarks
   * Until then {@link InventoryStore.lowStockMaterials} is empty or belongs to an earlier answer.
   */
  readonly lowStockLoading = signal(false);

  /**
   * Signal containing the loaded raw material batches.
   */
  readonly receipts = signal<RawMaterialBatch[]>([]);

  /**
   * Signal containing batches approaching their expiration date.
   */
  readonly nearExpiry = signal<RawMaterialBatch[]>([]);

  /**
   * Signal indicating whether the latest near-expiry request is still waiting for its answer.
   *
   * @remarks
   * Until then {@link InventoryStore.nearExpiry} is empty or belongs to an earlier answer.
   */
  readonly nearExpiryLoading = signal(false);

  /**
   * Signal containing inventory movements of the selected material.
   */
  readonly movements = signal<InventoryMovement[]>([]);

  /**
   * Signal containing usage records of the selected raw material.
   */
  readonly usages = signal<MaterialConsumption[]>([]);

  /**
   * Signal containing legacy inventory materials.
   */
  readonly legacy = signal<LegacyMaterial[]>([]);

  /**
   * Signal containing historical usage records of a legacy material.
   */
  readonly legacyHistory = signal<MaterialConsumption[]>([]);

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
  readonly containers = signal<StorageContainer[]>([]);

  /**
   * Signal containing the usage classification of the environment.
   */
  readonly environmentUsage = signal<string | null>(null);

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
  readonly lowCount = computed(
    () => this.materials().filter((material) => material.isLowStock).length,
  );

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
          .filter(
            (usage) => usage.inventoryReceiptId !== null && blocked.has(usage.inventoryReceiptId),
          )
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
  readonly availableContainers = computed(() =>
    this.containers().filter((container) => container.status === 'OPERATIONAL'),
  );

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
   * Identifies the latest low-stock filter request.
   * Prevents outdated responses from updating the store.
   */
  private lowStockRequestId = 0;

  /**
   * Identifies the latest near-expiry filter request.
   * Prevents outdated responses from updating the store.
   */
  private nearExpiryRequestId = 0;

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
   * Reads the environments of the laboratory (Laboratory → Inventory).
   *
   * @returns A Promise that resolves when the operation finishes.
   *
   * @remarks
   * On failure the previous list is kept and the reason is exposed through {@link InventoryStore.environmentsError}.
   */
  async loadEnvironments(): Promise<void> {
    this.environmentsLoading.set(true);
    this.environmentsError.set('');
    try {
      this.environments.set(await firstValueFrom(this.api.environments(this.lab)));
      this.environmentsLoaded.set(true);
    } catch (error) {
      this.environmentsError.set(inventoryError(error));
    } finally {
      this.environmentsLoading.set(false);
    }
  }

  /**
   * Picks the environment to open: the last one used in this browser, otherwise the first raw material storage,
   * otherwise the first environment of the laboratory.
   *
   * @returns The environment, or null when the laboratory has none.
   */
  preferredEnvironment(): StorageEnvironment | null {
    return this.environmentPreference.choose(this.lab, this.environments(), 'RAW_MATERIAL_STORAGE');
  }

  /**
   * Remembers the environment whose raw materials the user opened.
   *
   * @param environmentId - Identifier of the storage environment.
   */
  rememberEnvironment(environmentId: number): void {
    this.environmentPreference.remember(this.lab, environmentId);
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
      this.api.review(
        this.lab,
        this.environment,
        receipt.rawMaterialId,
        receipt.id,
        command.status,
        command.reason,
      ),
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
      this.api.assignContainer(
        this.lab,
        this.environment,
        receipt.rawMaterialId,
        receipt.id,
        containerMonitorId,
      ),
    );
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
    const environmentChanged = this.environmentId() !== environmentId;
    const generation = ++this.generation;

    // Invalidate filter requests started before this reload.
    ++this.lowStockRequestId;
    ++this.nearExpiryRequestId;
    this.lowStockLoading.set(false);
    this.nearExpiryLoading.set(false);

    if (environmentChanged) {
      this.materials.set([]);
      this.lowStockMaterials.set([]);
      this.nearExpiry.set([]);
      this.containers.set([]);
      this.environmentUsage.set(null);
    }

    this.environmentId.set(environmentId);
    this.selectedId.set(id);
    this.loading.set(true);
    this.error.set('');
    this.notice.set('');

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
        if (!materials.some((material) => material.id === id))
          throw new Error('inventory.notFound');
        const detail = await firstValueFrom(
          forkJoin({
            receipts: this.api.receipts(this.lab, environmentId, id),
            movements: this.api.movements(this.lab, environmentId, id),
            usages: this.api.materialConsumptions(this.lab, environmentId, id),
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
            const history = await firstValueFrom(
              this.api.legacyMaterialConsumptions(this.lab, legacyId),
            );
            if (generation === this.generation) this.legacyHistory.set(history);
          } catch (error) {
            if (generation === this.generation) this.legacyError.set(inventoryError(error));
          }
        }
      }
    } catch (error) {
      if (generation === this.generation) {
        this.materials.set([]);
        this.error.set(
          error instanceof Error && error.message.startsWith('inventory.')
            ? error.message
            : inventoryError(error),
        );
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
          containers: this.api.containers(this.lab, environmentId),
          environment: this.api.environment(this.lab, environmentId),
        }),
      );
      if (generation !== this.generation) return;
      this.containers.set(storage.containers);
      this.environmentUsage.set(storage.environment.usage);
    } catch (error) {
      if (generation !== this.generation) return;
      this.containers.set([]);
      this.environmentUsage.set(null);
      this.storageError.set(inventoryError(error));
    }
  }

  /**
   * Loads low-stock materials for the currently selected environment.
   *
   * Discards responses from outdated requests, including those
   * started before an environment change or inventory reload.
   */
  async loadLowStock(): Promise<void> {
    const environmentId = this.environment;
    const generation = this.generation;
    const requestId = ++this.lowStockRequestId;
    const current = () =>
      generation === this.generation &&
      requestId === this.lowStockRequestId &&
      environmentId === this.environmentId();
    this.lowStockLoading.set(true);

    try {
      const materials = await firstValueFrom(this.api.materials(this.lab, environmentId, 'LOW'));
      if (current()) this.lowStockMaterials.set(materials);
    } catch (error) {
      if (current()) this.error.set(inventoryError(error));
    } finally {
      if (current()) this.lowStockLoading.set(false);
    }
  }

  /**
   * Loads batches approaching expiration for the selected environment.
   *
   * Ignores outdated responses when the environment changes,
   * inventory reloads, or a newer filter request is started.
   *
   * @param withinDays Optional expiration threshold in days.
   */
  async loadNearExpiry(withinDays?: number): Promise<void> {
    const environmentId = this.environment;
    const generation = this.generation;
    const requestId = ++this.nearExpiryRequestId;
    const current = () =>
      generation === this.generation &&
      requestId === this.nearExpiryRequestId &&
      environmentId === this.environmentId();
    this.nearExpiryLoading.set(true);

    try {
      const batches = await firstValueFrom(
        this.api.environmentReceipts(this.lab, environmentId, 'NEAR_EXPIRY', withinDays),
      );
      if (current()) this.nearExpiry.set(batches);
    } catch (error) {
      if (current()) this.error.set(inventoryError(error));
    } finally {
      if (current()) this.nearExpiryLoading.set(false);
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

      const environmentId = this.environment;
      const materialId = this.selectedId();

      const reloaded = await this.load(environmentId, materialId);

      if (reloaded && !this.error()) {
        this.notice.set('inventory.saved');
      }
      return true;
    } catch (error) {
      this.error.set(inventoryError(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
