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
import { SaveRawMaterialCommand } from '../domain/model/save-raw-material.command';
import { ReceiveRawMaterialBatchCommand } from '../domain/model/receive-raw-material-batch.command';
import { ReviewRawMaterialBatchCommand } from '../domain/model/review-raw-material-batch.command';

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

@Injectable()
export class InventoryStore {
  private readonly api = inject(InventoryApi);
  private readonly iam = inject(IamStore);
  private readonly batchApi = inject(BatchApi);
  readonly materials = signal<RawMaterial[]>([]);
  readonly receipts = signal<RawMaterialBatch[]>([]);
  readonly movements = signal<InventoryMovement[]>([]);
  readonly legacy = signal<LegacyMaterial[]>([]);
  readonly legacyHistory = signal<RawMaterialUsage[]>([]);
  readonly legacyError = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly selectedId = signal<number | null>(null);
  readonly selected = computed(
    () => this.materials().find((material) => material.id === this.selectedId()) ?? null,
  );
  readonly canReview = computed(() =>
    this.iam.currentRoles().some((role) => ['ROLE_ADMIN', 'ROLE_QA_MANAGER'].includes(role)),
  );
  private generation = 0;
  get lab(): number {
    return this.iam.requireLaboratoryId();
  }
  saveMaterial(command: SaveRawMaterialCommand, id?: number) {
    return this.write(this.api.save(this.lab, command, id));
  }
  receive(material: number, command: ReceiveRawMaterialBatchCommand) {
    return this.write(this.api.receive(this.lab, material, command));
  }
  review(receipt: number, command: ReviewRawMaterialBatchCommand) {
    return this.write(this.api.review(this.lab, receipt, command.status, command.reason));
  }
  importMaterial(id: number) {
    return this.write(this.api.import(this.lab, id));
  }
  async load(id: number | null = null): Promise<void> {
    const generation = ++this.generation;
    this.selectedId.set(id);
    this.loading.set(true);
    this.error.set('');
    this.receipts.set([]);
    this.movements.set([]);
    this.legacyHistory.set([]);
    this.legacyError.set('');
    try {
      const materials = await firstValueFrom(this.api.materials(this.lab));
      if (generation !== this.generation) return;
      this.materials.set(materials);
      if (id !== null) {
        if (!materials.some((material) => material.id === id)) throw new Error('Not found');
        const detail = await firstValueFrom(
          forkJoin({
            receipts: this.api.receipts(this.lab, id),
            movements: this.api.movements(this.lab, id),
          }),
        );
        if (generation !== this.generation) return;
        this.receipts.set(detail.receipts);
        this.movements.set(detail.movements);
        const legacyId = this.selected()?.legacyId;
        if (legacyId) {
          try {
            const history = await firstValueFrom(this.batchApi.getMaterialHistory(legacyId));
            if (generation === this.generation) this.legacyHistory.set(history);
          } catch (error) {
            if (generation === this.generation) this.legacyError.set(inventoryError(error));
          }
        }
      }
    } catch (error) {
      if (generation === this.generation) {
        this.materials.set([]);
        this.error.set(inventoryError(error));
      }
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }
  async loadLegacy(): Promise<void> {
    this.error.set('');
    try {
      this.legacy.set(await firstValueFrom(this.api.legacy(this.lab)));
    } catch (error) {
      this.error.set(inventoryError(error));
    }
  }
  private async write(request: Observable<unknown>): Promise<boolean> {
    if (this.saving()) return false;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await firstValueFrom(request);
      this.notice.set('inventory.saved');
      await this.load(this.selectedId());
      return true;
    } catch (error) {
      this.error.set(inventoryError(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
