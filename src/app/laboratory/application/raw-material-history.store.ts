import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { LaboratoryApi } from '../infrastructure/laboratory-api';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { BatchApi } from '../../batch/infrastructure/batch-api';
import { Batch } from '../../batch/domain/model/batch.entity';
import { RawMaterialUsage } from '../../batch/domain/model/raw-material-usage.entity';

@Injectable()
export class RawMaterialHistoryStore {
  private readonly labApi = inject(LaboratoryApi);
  private readonly batchApi = inject(BatchApi);
  private request?: Subscription;
  readonly material = signal<RawMaterial | null>(null);
  readonly usages = signal<RawMaterialUsage[]>([]);
  readonly batches = signal<Batch[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasLegacy = computed(() => this.usages().some(usage => usage.stockAfter === null));

  constructor() { inject(DestroyRef).onDestroy(() => this.request?.unsubscribe()); }

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
      usages: this.batchApi.getMaterialHistory(materialId),
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

  batchLabel(batchId: number): string {
    return this.batches().find(batch => batch.id === batchId)?.batchNumber ?? `#${batchId}`;
  }
}
