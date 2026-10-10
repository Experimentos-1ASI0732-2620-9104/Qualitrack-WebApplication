import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { InventoryApi } from '../../inventory/infrastructure/inventory-api';
import { RawMaterial } from '../../inventory/domain/model/raw-material.entity';
import { RawMaterialBatch } from '../../inventory/domain/model/raw-material-batch.entity';
import { BatchApi } from '../infrastructure/batch-api';
import { BatchPath } from '../infrastructure/batch-api-endpoint';
import { batchError } from './batch.store';

/**
 * Consumption of raw material lots by a product batch.
 *
 * @remarks
 * The user picks the environment where the raw material is kept, the material and one of its usable lots;
 * Product Batch Management asks Inventory to consume it. A retry of the same consumption reuses its
 * operation id, so the stock is never discounted twice.
 *
 * @example
 * ```typescript
 * // In the component: providers: [RawMaterialConsumptionStore]
 * const store = inject(RawMaterialConsumptionStore);
 *
 * await store.selectEnvironment(environmentId);
 * await store.selectMaterial(materialId);
 * store.lotId.set(lotId);
 * await store.consume(path, batchId, 150.5);
 * ```
 *
 * @author Qualitrack
 */
@Injectable()
export class RawMaterialConsumptionStore {
  private readonly inventory = inject(InventoryApi);
  private readonly batches = inject(BatchApi);
  private readonly iam = inject(IamStore);
  /** Identifies the latest selection; answers of older generations are ignored. */
  private generation = 0;
  /** Last consumption attempt: its signature and the operation id reused when the same one is retried. */
  private attempt?: { signature: string; key: string };

  /** The environment where the raw materials are kept; null until one is selected. */
  readonly environmentId = signal<number | null>(null);
  /** Raw materials kept in the selected environment. */
  readonly materials = signal<RawMaterial[]>([]);
  /** Usable lots of the selected raw material. */
  readonly lots = signal<RawMaterialBatch[]>([]);
  /** Identifier of the selected lot; null while none is selected. */
  readonly lotId = signal<number | null>(null);
  /** Whether a read request is in progress. */
  readonly loading = signal(false);
  /** Whether a consumption is in progress. */
  readonly saving = signal(false);
  /** Translation key or server message of the last failure; null when there is none. */
  readonly error = signal<string | null>(null);
  /** Whether the last consumption was saved. */
  readonly saved = signal(false);
  /** The selected lot; null while none is selected. */
  readonly selectedLot = computed(() => this.lots().find((lot) => lot.id === this.lotId()) ?? null);

  /**
   * Loads the raw materials kept in the environment.
   *
   * @param environmentId - The environment identifier.
   */
  async selectEnvironment(environmentId: number): Promise<void> {
    const generation = ++this.generation;
    this.environmentId.set(environmentId);
    this.materials.set([]);
    this.lots.set([]);
    this.lotId.set(null);
    this.error.set(null);
    this.loading.set(true);
    try {
      const materials = await firstValueFrom(
        this.inventory.materials(this.laboratoryId, environmentId),
      );
      if (generation === this.generation) this.materials.set(materials);
    } catch (error) {
      if (generation === this.generation) this.error.set(batchError(error));
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /**
   * Loads the usable lots of a raw material: released, not expired and with stock.
   *
   * @param materialId - The raw material identifier, or null to clear the selection.
   */
  async selectMaterial(materialId: number | null): Promise<void> {
    const generation = ++this.generation;
    const environmentId = this.environmentId();
    this.lots.set([]);
    this.lotId.set(null);
    this.error.set(null);
    if (materialId === null || environmentId === null) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    try {
      const lots = await firstValueFrom(
        this.inventory.receipts(this.laboratoryId, environmentId, materialId, true),
      );
      if (generation === this.generation) this.lots.set(lots);
    } catch (error) {
      if (generation === this.generation) this.error.set(batchError(error));
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /**
   * Consumes the amount from the selected lot for the batch.
   *
   * @remarks
   * The operation id is generated once per distinct attempt (batch, lot, amount and unit) and kept until the
   * consumption succeeds, so a retry after a network failure does not discount the stock twice.
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The batch identifier.
   * @param amount - The amount to consume.
   * @returns True when the consumption was saved; false when it failed or no lot is selected.
   */
  async consume(
    path: BatchPath,
    batchId: number,
    amount: number
  ): Promise<boolean> {
    const lot = this.selectedLot();
    if (!lot || this.saving()) return false;
    const signature = JSON.stringify([batchId, lot.id, amount, lot.unit]);
    if (this.attempt?.signature !== signature)
      this.attempt = { signature, key: crypto.randomUUID() };
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.batches.registerRawMaterialUsage(path, batchId, {
          rawMaterialBatchId: lot.id,
          amountUsed: amount,
          unit: lot.unit,
          operationId: this.attempt.key,
        }),
      );
      this.attempt = undefined;
      await this.refreshStock(lot.rawMaterialId, lot.id);
      this.saved.set(true);
      return true;
    } catch (error) {
      // The stock may have changed meanwhile: show the current lots before explaining the failure.
      await this.refreshStock(lot.rawMaterialId, lot.id);
      this.error.set(batchError(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Reloads materials and usable lots after a consumption, keeping the lot selected while it is still usable.
   *
   * @param materialId - The raw material identifier.
   * @param lotId - The lot that was selected.
   */
  private async refreshStock(
    materialId: number,
    lotId: number
  ): Promise<void> {
    const environmentId = this.environmentId();
    if (environmentId === null) return;
    try {
      const [materials, lots] = await Promise.all([
        firstValueFrom(this.inventory.materials(this.laboratoryId, environmentId)),
        firstValueFrom(this.inventory.receipts(this.laboratoryId, environmentId, materialId, true)),
      ]);
      this.materials.set(materials);
      this.lots.set(lots);
      this.lotId.set(lots.some((lot) => lot.id === lotId) ? lotId : null);
    } catch (error) {
      this.error.set(batchError(error));
    }
  }

  /**
   * The laboratory of the signed-in user.
   */
  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }
}
