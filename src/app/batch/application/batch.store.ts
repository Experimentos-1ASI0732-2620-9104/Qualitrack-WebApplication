import { HttpErrorResponse } from '@angular/common/http';
import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../shared/infrastructure/api-error';
import { EnvironmentPreference } from '../../shared/infrastructure/environment-preference';
import { IamStore } from '../../iam/application/iam.store';
import { BatchApi } from '../infrastructure/batch-api';
import { BatchPath } from '../domain/model/batch-path';
import { Batch } from '../domain/model/batch.entity';
import { BatchTraceability } from '../domain/model/batch-traceability.entity';
import { CreateBatchCommand } from '../domain/model/create-batch.command';
import { ConsumableLot } from '../domain/model/consumable-lot.entity';
import { ConsumableRawMaterial } from '../domain/model/consumable-raw-material.entity';
import { CreateProductCommand } from '../domain/model/create-product.command';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { ProductionEnvironment } from '../domain/model/production-environment.entity';
import { ProductionEquipment } from '../domain/model/production-equipment.entity';
import { ProductionStaffMember } from '../domain/model/production-staff-member.entity';
import { ReleaseBatchCommand } from '../domain/model/release-batch.command';
import { RejectBatchCommand } from '../domain/model/reject-batch.command';

/**
 * Translates API failures of the product batch views into translation keys or server details.
 *
 * @remarks
 * Connection failures (status 0), forbidden (403) and not found (404) responses map to fixed translation
 * keys; other failures return the server detail when it explains the business rule.
 *
 * @example
 * ```typescript
 * this._error.set(batchError(error));
 * ```
 *
 * @param error - The failure raised by the API facade
 * @returns A translation key, or the server message when it explains the business rule
 */
export function batchError(error: unknown): string {
  const status =
    error instanceof ApiError
      ? error.status
      : error instanceof HttpErrorResponse
        ? error.status
        : null;
  if (status === 0) return 'batches.errors.connection';
  if (status === 403) return 'batches.errors.forbidden';
  if (status === 404) return 'batches.errors.not-found';
  if (error instanceof ApiError) return error.details || error.message;
  if (error instanceof HttpErrorResponse)
    return error.error?.details || error.error?.message || 'batches.errors.failed';
  return 'batches.errors.failed';
}

/**
 * Application store of product batches (US73-US82).
 *
 * @remarks
 * Batches are addressed through their laboratory, environment and product. The laboratory-wide list
 * feeds the batch list, the dashboard and the report generator; the selected batch keeps its
 * traceability so the detail tabs show consumptions, equipment, staff and the final decision.
 *
 * The store also keeps the environments of the laboratory, the pharmaceutical products of an environment and the
 * raw material lots that a batch can consume, each through the models of Product Batch Management. Generation counters discard the answers of outdated product and consumption requests, so a
 * slow response never overwrites a newer one.
 *
 * @example
 * ```typescript
 * const store = inject(BatchStore);
 *
 * store.loadBatches(laboratoryId);
 * const batches = store.batches();
 * ```
 *
 * @author Qualitrack
 */
@Injectable({ providedIn: 'root' })
export class BatchStore {
  private readonly api = inject(BatchApi);
  private readonly iam = inject(IamStore);
  /** Production environment opened last time in this browser. */
  private readonly productionPreference = new EnvironmentPreference('production');
  /** Raw material storage opened last time in this browser, shared with the inventory views. */
  private readonly storagePreference = new EnvironmentPreference('inventory');
  /** Identifies the latest product request; answers of older generations are ignored. */
  private productGeneration = 0;
  /** Identifies the latest consumption request; answers of older generations are ignored. */
  private consumptionGeneration = 0;
  /** Operation id of a failed consumption, reused when the same consumption is retried. */
  private consumptionAttempt?: { signature: string; key: string };

  // Signals
  private readonly _batches = signal<Batch[]>([]);
  private readonly _productBatches = signal<Batch[]>([]);
  private readonly _selectedBatch = signal<Batch | null>(null);
  private readonly _traceability = signal<BatchTraceability | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMsg = signal<string | null>(null);
  private readonly _environments = signal<ProductionEnvironment[]>([]);
  private readonly _environmentsLoaded = signal(false);
  private readonly _environmentsLoading = signal(false);
  private readonly _environmentsError = signal<string | null>(null);
  private readonly _productEnvironmentId = signal<number | null>(null);
  private readonly _products = signal<PharmaceuticalProduct[]>([]);
  private readonly _product = signal<PharmaceuticalProduct | null>(null);
  private readonly _productsLoading = signal(false);
  private readonly _productSaving = signal(false);
  private readonly _productError = signal<string | null>(null);
  private readonly _consumptionEnvironmentId = signal<number | null>(null);
  private readonly _consumptionMaterials = signal<ConsumableRawMaterial[]>([]);
  private readonly _consumptionLots = signal<ConsumableLot[]>([]);
  private readonly _consumptionLotId = signal<number | null>(null);
  private readonly _consumptionLoading = signal(false);
  private readonly _consumptionSaving = signal(false);
  private readonly _consumptionError = signal<string | null>(null);
  private readonly _consumptionSaved = signal(false);
  private readonly _people = signal<ReadonlyMap<number, string>>(new Map());

  // Properties
  /** Batches of every product of the laboratory, newest first. */
  readonly batches = this._batches.asReadonly();
  /** Batches of the product being viewed. */
  readonly productBatches = this._productBatches.asReadonly();
  /** The batch opened in the detail view; null while none is loaded. */
  readonly selectedBatch = this._selectedBatch.asReadonly();
  /** Traceability of the selected batch; null while none is loaded. */
  readonly traceability = this._traceability.asReadonly();
  /** Whether a read request is in progress. */
  readonly isLoading = this._isLoading.asReadonly();
  /** Whether a write request is in progress. */
  readonly saving = this._saving.asReadonly();
  /** Translation key or server message of the last failure; null when there is none. */
  readonly error = this._error.asReadonly();
  /** Translation key of the last successful write; null when there is none. */
  readonly successMsg = this._successMsg.asReadonly();
  /** Releases and rejections are reserved to quality managers and administrators. */
  readonly canDecide = this.iam.canManageQuality;
  /** Batches, usages and participations are registered by operators and quality managers, not auditors. */
  readonly canOperate = this.iam.canOperate;
  /** Environments of the laboratory: production areas and raw material and product storage. */
  readonly environments = this._environments.asReadonly();
  /** Whether the environments have been read at least once. */
  readonly environmentsLoaded = this._environmentsLoaded.asReadonly();
  /** Whether the environments are being read. */
  readonly environmentsLoading = this._environmentsLoading.asReadonly();
  /** Translation key or server message of the failure to read the environments; null when there is none. */
  readonly environmentsError = this._environmentsError.asReadonly();
  /** Whether the laboratory has no environment yet. */
  readonly environmentsEmpty = computed(() => this._environmentsLoaded() && this._environments().length === 0);
  /** The environment whose products are shown; null until one is loaded. */
  readonly productEnvironmentId = this._productEnvironmentId.asReadonly();
  /** Products of the environment. */
  readonly products = this._products.asReadonly();
  /** The product opened in the detail view; null while none is loaded. */
  readonly product = this._product.asReadonly();
  /** Whether a product read request is in progress. */
  readonly productsLoading = this._productsLoading.asReadonly();
  /** Whether a product is being registered. */
  readonly productSaving = this._productSaving.asReadonly();
  /** Translation key or server message of the last product failure; null when there is none. */
  readonly productError = this._productError.asReadonly();
  /** Products are registered by quality managers and administrators. */
  readonly canManageProducts = this.iam.canManageQuality;
  /** The environment whose raw materials a batch can consume; null until one is selected. */
  readonly consumptionEnvironmentId = this._consumptionEnvironmentId.asReadonly();
  /** Raw materials of that environment, with their usable stock. */
  readonly consumptionMaterials = this._consumptionMaterials.asReadonly();
  /** Released lots of the selected raw material. */
  readonly consumptionLots = this._consumptionLots.asReadonly();
  /** The lot chosen for the consumption; null while none is chosen. */
  readonly consumptionLotId = this._consumptionLotId.asReadonly();
  /** Whether raw materials or lots are being read. */
  readonly consumptionLoading = this._consumptionLoading.asReadonly();
  /** Whether a consumption is being registered. */
  readonly consumptionSaving = this._consumptionSaving.asReadonly();
  /** Translation key or server message of the last consumption failure; null when there is none. */
  readonly consumptionError = this._consumptionError.asReadonly();
  /** Whether the last consumption was registered. */
  readonly consumptionSaved = this._consumptionSaved.asReadonly();
  /** Full names of the staff by user account, to name who signed, stored or registered something. */
  readonly people = this._people.asReadonly();
  /** Username of the signed-in user, to name them when they are not in the staff of the laboratory. */
  readonly currentUsername = this.iam.currentUsername;
  /** The chosen lot; null while none is chosen or it is no longer usable. */
  readonly consumptionLot = computed(
    () => this._consumptionLots().find((lot) => lot.id === this._consumptionLotId()) ?? null,
  );

  /**
   * Loads every batch of the laboratory, newest first.
   *
   * @param labId - The laboratory identifier.
   */
  loadBatches(labId: number): void {
    this.startRequest();
    this.api.getBatches(labId).subscribe({
      next: (batches) => {
        this._batches.set([...batches].sort((a, b) => b.id - a.id));
        this._isLoading.set(false);
      },
      error: (error) => this.fail(error),
    });
  }

  /**
   * Reads the equipment of the laboratory: the process equipment a batch uses and the container monitors where it is
   * stored (Equipment → Product Batch).
   *
   * @returns The equipment of the laboratory of the session.
   */
  async loadProductionEquipment(): Promise<ProductionEquipment[]> {
    return firstValueFrom(this.api.getProductionEquipment(this.laboratoryId));
  }

  /**
   * Reads the staff of the laboratory, to assign them to a batch (Laboratory → Product Batch).
   *
   * @remarks
   * The names of the staff with a user account are kept in {@link BatchStore.people}.
   *
   * @returns The staff members of the laboratory of the session.
   */
  async loadStaff(): Promise<ProductionStaffMember[]> {
    const staff = await firstValueFrom(this.api.getStaff(this.laboratoryId));
    const people = new Map<number, string>();
    for (const member of staff) if (member.userId !== null) people.set(member.userId, member.fullName);
    this._people.set(people);
    return staff;
  }

  /**
   * Reads the staff of the laboratory only to name the people of a batch: who signed the release, stored the batch or
   * registered equipment and staff.
   *
   * @remarks
   * Names are a convenience: when the staff cannot be read, the views keep showing the user ids.
   */
  async loadPeople(): Promise<void> {
    try {
      await this.loadStaff();
    } catch {
      // The ids are shown instead of the names.
    }
  }

  /**
   * Full name of the staff member behind a user account.
   *
   * @param userId - The user account identifier.
   * @returns The full name, or null when the account is not in the staff of the laboratory.
   */
  personName(userId: number | null): string | null {
    return userId === null ? null : (this._people().get(userId) ?? null);
  }

  /**
   * Whether a user account is the one of the signed-in user.
   *
   * @param userId - The user account identifier.
   * @returns True when the account is the one of the session.
   */
  isCurrentUser(userId: number | null): boolean {
    return userId !== null && userId === this.iam.currentUserId();
  }

  /**
   * Reads the environments of the laboratory (Laboratory → Product Batch).
   *
   * @remarks
   * On failure the previous list is kept and the reason is exposed through {@link BatchStore.environmentsError}.
   */
  async loadEnvironments(): Promise<void> {
    this._environmentsLoading.set(true);
    this._environmentsError.set(null);
    try {
      this._environments.set(await firstValueFrom(this.api.getEnvironments(this.laboratoryId)));
      this._environmentsLoaded.set(true);
    } catch (error) {
      this._environmentsError.set(batchError(error));
    } finally {
      this._environmentsLoading.set(false);
    }
  }

  /**
   * The environment whose products open by default: the last one used for production in this browser, otherwise the
   * first production environment, otherwise the first environment.
   *
   * @returns The environment, or null when the laboratory has none.
   */
  preferredProductionEnvironment(): ProductionEnvironment | null {
    return this.productionPreference.choose(this.laboratoryId, this._environments(), 'PRODUCTION');
  }

  /**
   * Remembers the environment whose products the user opened.
   *
   * @param environmentId - The environment identifier.
   */
  rememberProductionEnvironment(environmentId: number): void {
    this.productionPreference.remember(this.laboratoryId, environmentId);
  }

  /**
   * The environment where a consumption looks for raw materials: the raw material storage opened last time in this
   * browser, otherwise the first raw material storage, otherwise the first environment.
   *
   * @returns The environment, or null when the laboratory has none.
   */
  preferredStorageEnvironment(): ProductionEnvironment | null {
    return this.storagePreference.choose(this.laboratoryId, this._environments(), 'RAW_MATERIAL_STORAGE');
  }

  /**
   * Finds a batch of the laboratory of the session by its identifier.
   *
   * @param batchId - The batch identifier.
   * @returns The batch, or undefined if the laboratory has no batch with that identifier.
   */
  async findBatch(batchId: number): Promise<Batch | undefined> {
    const batches = await firstValueFrom(this.api.getBatches(this.iam.requireLaboratoryId()));
    return batches.find((batch) => batch.id === batchId);
  }

  /**
   * Loads the batches of one product.
   *
   * @param path - Laboratory, environment and product of the batches.
   */
  async loadProductBatches(path: BatchPath): Promise<void> {
    this.startRequest();
    this._productBatches.set([]);
    try {
      this._productBatches.set(await firstValueFrom(this.api.getProductBatches(path)));
    } catch (error) {
      this._error.set(batchError(error));
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Loads a batch together with its traceability.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   */
  async loadBatch(
    path: BatchPath,
    batchId: number
  ): Promise<void> {
    this.startRequest();
    this._selectedBatch.set(null);
    this._traceability.set(null);
    try {
      const traceability = await firstValueFrom(this.api.getTraceability(path, batchId));
      this._traceability.set(traceability);
      this._selectedBatch.set(traceability.batch);
    } catch (error) {
      this._error.set(batchError(error));
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Reloads the traceability of the selected batch after a manufacturing record is added.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   */
  async refreshTraceability(
    path: BatchPath,
    batchId: number
  ): Promise<void> {
    try {
      const traceability = await firstValueFrom(this.api.getTraceability(path, batchId));
      this._traceability.set(traceability);
      this._selectedBatch.set(traceability.batch);
    } catch (error) {
      this._error.set(batchError(error));
    }
  }

  /**
   * Registers a pending batch of the product.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param command - The data of the batch to register; empty notes are not sent.
   * @returns The registered batch, or null when the request failed.
   */
  async createBatch(
    path: BatchPath,
    command: CreateBatchCommand
  ): Promise<Batch | null> {
    return this.write(
      () =>
        firstValueFrom(
          this.api.createBatch(path, { ...command, notes: command.notes || undefined }),
        ),
      'batch-form.saved',
    );
  }

  /**
   * Releases the batch with the signature of the current user.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param command - Release date and notes.
   * @returns True when the batch was released.
   */
  async releaseBatch(
    path: BatchPath,
    batchId: number,
    command: ReleaseBatchCommand,
  ): Promise<boolean> {
    return (
      (await this.write(
        () => firstValueFrom(this.api.releaseBatch(path, batchId, command)),
        'batch-release.saved',
      )) !== null
    );
  }

  /**
   * Rejects the batch and keeps the reason.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param command - Rejection date and reason.
   * @returns True when the batch was rejected.
   */
  async rejectBatch(
    path: BatchPath,
    batchId: number,
    command: RejectBatchCommand,
  ): Promise<boolean> {
    return (
      (await this.write(
        () => firstValueFrom(this.api.rejectBatch(path, batchId, command)),
        'batch-reject.saved',
      )) !== null
    );
  }

  /**
   * Associates an operational equipment with the batch and refreshes the traceability.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param equipmentId - The equipment identifier.
   * @returns True when the equipment was associated.
   */
  async registerEquipment(
    path: BatchPath,
    batchId: number,
    equipmentId: number
  ): Promise<boolean> {
    const saved = await this.write(
      () => firstValueFrom(this.api.registerEquipmentUsage(path, batchId, equipmentId)),
      'batch-participants.equipment-saved',
    );
    if (saved) await this.refreshTraceability(path, batchId);
    return saved !== null;
  }

  /**
   * Stores the batch in a monitored container of a product storage environment and refreshes the traceability.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param containerMonitorId - The container monitor identifier.
   * @returns True when the batch was stored.
   */
  async assignContainer(
    path: BatchPath,
    batchId: number,
    containerMonitorId: number,
  ): Promise<boolean> {
    const saved = await this.write(
      () => firstValueFrom(this.api.assignContainer(path, batchId, containerMonitorId)),
      'batch-storage.saved',
    );
    if (saved) await this.refreshTraceability(path, batchId);
    return saved !== null;
  }

  /**
   * Associates a staff member with the batch and refreshes the traceability.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param staffId - The staff member identifier.
   * @returns True when the staff member was associated.
   */
  async registerStaff(
    path: BatchPath,
    batchId: number,
    staffId: number
  ): Promise<boolean> {
    const saved = await this.write(
      () => firstValueFrom(this.api.registerStaffParticipation(path, batchId, staffId)),
      'batch-participants.staff-saved',
    );
    if (saved) await this.refreshTraceability(path, batchId);
    return saved !== null;
  }

  /**
   * Sets the environment of the product being registered.
   *
   * @param environmentId - The environment identifier.
   */
  selectProductEnvironment(environmentId: number): void {
    this._productEnvironmentId.set(environmentId);
    this._productError.set(null);
  }

  /**
   * Loads the products of the environment.
   *
   * @param environmentId - The environment identifier.
   * @returns True when the products were loaded; false when the request failed or was superseded.
   */
  async loadProducts(environmentId: number): Promise<boolean> {
    const generation = ++this.productGeneration;
    if (this._productEnvironmentId() !== environmentId) this._products.set([]);
    this._productEnvironmentId.set(environmentId);
    this._productsLoading.set(true);
    this._productError.set(null);
    try {
      const products = await firstValueFrom(this.api.getProducts(this.laboratoryId, environmentId));
      if (generation !== this.productGeneration) return false;
      this._products.set(products);
      return true;
    } catch (error) {
      if (generation === this.productGeneration) {
        this._products.set([]);
        this._productError.set(batchError(error));
      }
      return false;
    } finally {
      if (generation === this.productGeneration) this._productsLoading.set(false);
    }
  }

  /**
   * Loads one product of the environment.
   *
   * @param environmentId - The environment identifier.
   * @param productId - The product identifier.
   */
  async loadProduct(
    environmentId: number,
    productId: number
  ): Promise<void> {
    const generation = ++this.productGeneration;
    this._productEnvironmentId.set(environmentId);
    this._product.set(null);
    this._productsLoading.set(true);
    this._productError.set(null);
    try {
      const product = await firstValueFrom(
        this.api.getProduct(this.laboratoryId, environmentId, productId),
      );
      if (generation === this.productGeneration) this._product.set(product);
    } catch (error) {
      if (generation === this.productGeneration) this._productError.set(batchError(error));
    } finally {
      if (generation === this.productGeneration) this._productsLoading.set(false);
    }
  }

  /**
   * Registers a product in the environment and returns it.
   *
   * @param environmentId - The environment where the product will be manufactured.
   * @param command - The data of the product; a blank description is sent as null.
   * @returns The registered product, or null when the request failed or another one is in progress.
   */
  async createProduct(
    environmentId: number,
    command: CreateProductCommand,
  ): Promise<PharmaceuticalProduct | null> {
    if (this._productSaving()) return null;
    this._productSaving.set(true);
    this._productError.set(null);
    try {
      return await firstValueFrom(
        this.api.createProduct(this.laboratoryId, environmentId, {
          ...command,
          description: command.description?.trim() || null,
        }),
      );
    } catch (error) {
      this._productError.set(batchError(error));
      return null;
    } finally {
      this._productSaving.set(false);
    }
  }

  /**
   * Forgets the raw materials, lots and messages of a previous consumption form.
   */
  clearConsumption(): void {
    this.consumptionGeneration++;
    this._consumptionEnvironmentId.set(null);
    this._consumptionMaterials.set([]);
    this._consumptionLots.set([]);
    this._consumptionLotId.set(null);
    this._consumptionLoading.set(false);
    this._consumptionError.set(null);
    this._consumptionSaved.set(false);
  }

  /**
   * Loads the raw materials of the environment where they are kept.
   *
   * @param environmentId - The environment identifier.
   */
  async selectConsumptionEnvironment(environmentId: number): Promise<void> {
    const generation = ++this.consumptionGeneration;
    this._consumptionEnvironmentId.set(environmentId);
    this._consumptionMaterials.set([]);
    this._consumptionLots.set([]);
    this._consumptionLotId.set(null);
    this._consumptionError.set(null);
    this._consumptionLoading.set(true);
    try {
      const materials = await firstValueFrom(
        this.api.getConsumableRawMaterials(this.laboratoryId, environmentId),
      );
      if (generation === this.consumptionGeneration) this._consumptionMaterials.set(materials);
    } catch (error) {
      if (generation === this.consumptionGeneration) this._consumptionError.set(batchError(error));
    } finally {
      if (generation === this.consumptionGeneration) this._consumptionLoading.set(false);
    }
  }

  /**
   * Loads the released lots of a raw material of the selected environment.
   *
   * @param materialId - The raw material identifier, or null to clear the lots.
   */
  async selectConsumptionMaterial(materialId: number | null): Promise<void> {
    const generation = ++this.consumptionGeneration;
    const environmentId = this._consumptionEnvironmentId();
    this._consumptionLots.set([]);
    this._consumptionLotId.set(null);
    this._consumptionError.set(null);
    if (materialId === null || environmentId === null) {
      this._consumptionLoading.set(false);
      return;
    }
    this._consumptionLoading.set(true);
    try {
      const lots = await firstValueFrom(
        this.api.getConsumableLots(this.laboratoryId, environmentId, materialId),
      );
      if (generation === this.consumptionGeneration) this._consumptionLots.set(lots);
    } catch (error) {
      if (generation === this.consumptionGeneration) this._consumptionError.set(batchError(error));
    } finally {
      if (generation === this.consumptionGeneration) this._consumptionLoading.set(false);
    }
  }

  /**
   * Chooses the lot to consume.
   *
   * @param lotId - The lot identifier, or null to clear the choice.
   */
  selectConsumptionLot(lotId: number | null): void {
    this._consumptionLotId.set(lotId);
  }

  /**
   * Registers the consumption of the chosen lot by a batch.
   *
   * @remarks
   * A retry of the same consumption keeps its operation id, so the platform does not discount the lot twice.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param amount - The amount consumed, in the unit of the lot.
   * @returns True when the consumption was registered.
   */
  async consumeRawMaterial(
    path: BatchPath,
    batchId: number,
    amount: number
  ): Promise<boolean> {
    const lot = this.consumptionLot();
    if (!lot || this._consumptionSaving()) return false;
    const signature = JSON.stringify([batchId, lot.id, amount, lot.unit]);
    if (this.consumptionAttempt?.signature !== signature)
      this.consumptionAttempt = { signature, key: crypto.randomUUID() };
    this._consumptionSaving.set(true);
    this._consumptionSaved.set(false);
    this._consumptionError.set(null);
    try {
      await firstValueFrom(
        this.api.registerRawMaterialUsage(path, batchId, {
          rawMaterialBatchId: lot.id,
          amountUsed: amount,
          unit: lot.unit,
          operationId: this.consumptionAttempt.key,
        }),
      );
      this.consumptionAttempt = undefined;
      await this.refreshConsumptionStock(lot.rawMaterialId, lot.id);
      this._consumptionSaved.set(true);
      return true;
    } catch (error) {
      // The stock may have changed meanwhile: show the current lots before explaining the failure.
      await this.refreshConsumptionStock(lot.rawMaterialId, lot.id);
      this._consumptionError.set(batchError(error));
      return false;
    } finally {
      this._consumptionSaving.set(false);
    }
  }

  /**
   * Clears the last error and success messages.
   */
  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Runs a write request, ignoring it while another one is in progress.
   *
   * @param request - The request to run.
   * @param success - Translation key shown when the request succeeds.
   * @returns The result of the request (an empty object when it has no body), or null when it failed or was ignored.
   */
  private async write<T>(
    request: () => Promise<T>,
    success: string
  ): Promise<T | null> {
    if (this._saving()) return null;
    this._saving.set(true);
    this.clearMessages();
    try {
      const result = await request();
      this._successMsg.set(success);
      return result ?? ({} as T);
    } catch (error) {
      this._error.set(batchError(error));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  /**
   * Marks the start of a read request.
   */
  private startRequest(): void {
    this._isLoading.set(true);
    this._error.set(null);
  }

  /**
   * Stores the failure of a read request and stops the loading state.
   *
   * @param error - The failure raised by the API facade.
   */
  private fail(error: unknown): void {
    this._error.set(batchError(error));
    this._isLoading.set(false);
  }

  /**
   * Reads again the raw materials and lots after a consumption, keeping the lot while it is still usable.
   *
   * @param materialId - The consumed raw material.
   * @param lotId - The consumed lot.
   */
  private async refreshConsumptionStock(
    materialId: number,
    lotId: number
  ): Promise<void> {
    const environmentId = this._consumptionEnvironmentId();
    if (environmentId === null) return;
    try {
      const [materials, lots] = await Promise.all([
        firstValueFrom(this.api.getConsumableRawMaterials(this.laboratoryId, environmentId)),
        firstValueFrom(this.api.getConsumableLots(this.laboratoryId, environmentId, materialId)),
      ]);
      this._consumptionMaterials.set(materials);
      this._consumptionLots.set(lots);
      this._consumptionLotId.set(lots.some((lot) => lot.id === lotId) ? lotId : null);
    } catch (error) {
      this._consumptionError.set(batchError(error));
    }
  }

  /**
   * The laboratory of the signed-in user.
   */
  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }
}
