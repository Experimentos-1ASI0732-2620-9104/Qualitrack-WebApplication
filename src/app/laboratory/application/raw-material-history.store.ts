import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { LaboratoryApi } from '../infrastructure/laboratory-api';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { BatchApi } from '../../batch/infrastructure/batch-api';
import { Batch } from '../../batch/domain/model/batch.entity';
import { RawMaterialUsage } from '../../batch/domain/model/raw-material-usage.entity';

/**
 * Application store for the usage history of a raw material.
 *
 * @remarks
 * Combines the raw material of the Laboratory bounded context with the usages and batches
 * of Product Batch Management, so the history can show in which batch each quantity was used.
 * It is provided per view, and the pending request is cancelled when the view is destroyed.
 * Errors are exposed as translation keys.
 */
@Injectable()
export class RawMaterialHistoryStore {
  /**
   * Laboratory API facade used to read the raw materials.
   */
  private readonly labApi = inject(LaboratoryApi);

  /**
   * Batch API facade used to read the usages and the batches.
   */
  private readonly batchApi = inject(BatchApi);

  /**
   * Request in progress, cancelled when a new load starts or the store is destroyed.
   */
  private request?: Subscription;

  /**
   * Raw material whose history is shown, or `null` while loading or when it does not exist.
   */
  readonly material = signal<RawMaterial | null>(null);

  /**
   * Usages of the raw material in production batches.
   */
  readonly usages = signal<RawMaterialUsage[]>([]);

  /**
   * Batches of the laboratory, used to label each usage.
   */
  readonly batches = signal<Batch[]>([]);

  /**
   * Indicates whether the history is being loaded.
   */
  readonly loading = signal(false);

  /**
   * Translation key of the latest error, if any.
   */
  readonly error = signal<string | null>(null);

  /**
   * Indicates whether any usage was registered before the stock after each usage was recorded.
   */
  readonly hasLegacy = computed(() => this.usages().some(usage => usage.stockAfter === null));

  /**
   * Creates a new RawMaterialHistoryStore and cancels its pending request on destroy.
   */
  constructor() { inject(DestroyRef).onDestroy(() => this.request?.unsubscribe()); }

  /**
   * Loads a raw material together with its usages and the batches of the laboratory.
   *
   * @remarks
   * Any previous request is cancelled and the state is reset first. An invalid identifier
   * reports `material-history.not-found` without calling the API.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param materialId - Numeric identifier of the raw material
   */
  load(laboratoryId: number, materialId: number): void {
    this.request?.unsubscribe();
    this.material.set(null);
    this.usages.set([]);
    this.batches.set([]);
    this.error.set(null);
    if (!Number.isSafeInteger(materialId) || materialId <= 0) {
      this.loading.set(false);
      this.error.set('material-history.not-found');
      return;
    }
    this.loading.set(true);
    this.request = forkJoin({
      materials: this.labApi.getRawMaterials(laboratoryId),
      usages: this.batchApi.getMaterialHistory(laboratoryId, materialId),
      batches: this.batchApi.getBatches(laboratoryId),
    }).subscribe({
      next: ({ materials, usages, batches }) => {
        this.material.set(materials.find(material => material.id === materialId) ?? null);
        this.usages.set(usages);
        this.batches.set(batches);
        if (!this.material()) this.error.set('material-history.not-found');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('material-history.load-error');
        this.loading.set(false);
      },
    });
  }

  /**
   * Returns the label used to show a batch in the history.
   *
   * @param batchId - Numeric identifier of the batch
   * @returns The batch number, or `#<batchId>` when the batch is not loaded
   */
  batchLabel(batchId: number): string {
    return this.batches().find(batch => batch.id === batchId)?.batchNumber ?? `#${batchId}`;
  }
}
