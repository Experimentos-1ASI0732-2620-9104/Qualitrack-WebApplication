import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { InventoryApi } from '../infrastructure/inventory-api';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { AvailableReceipt } from '../domain/model/available-receipt.entity';
import { ConsumeRawMaterialBatchCommand } from '../domain/model/consume-raw-material-batch.command';
import { IamStore } from '../../iam/application/iam.store';
import { inventoryError } from './inventory.store';

/** View-scoped selection and idempotent consumption state, shared with Batch presentation. */
@Injectable()
export class ReceiptConsumptionStore {
  private readonly api = inject(InventoryApi);
  private readonly iam = inject(IamStore);
  readonly materials = signal<RawMaterial[]>([]);
  readonly receipts = signal<AvailableReceipt[]>([]);
  readonly receiptId = signal<number | null>(null);
  readonly error = signal('');
  readonly saved = signal(false);
  private readonly materialsLoading = signal(false);
  private readonly receiptsLoading = signal(false);
  readonly loading = computed(() => this.materialsLoading() || this.receiptsLoading());
  readonly saving = signal(false);
  readonly selectedReceipt = computed(
    () => this.receipts().find((receipt) => receipt.id === this.receiptId()) ?? null,
  );
  private generation = 0;
  private attempt?: { signature: string; key: string };

  async loadMaterials() {
    this.materialsLoading.set(true);
    this.error.set('');
    try {
      this.materials.set(await firstValueFrom(this.api.materials(this.iam.requireLaboratoryId())));
    } catch (error) {
      this.materials.set([]);
      this.error.set(inventoryError(error));
    } finally {
      this.materialsLoading.set(false);
    }
  }
  async selectMaterial(material: number | null) {
    const generation = ++this.generation;
    this.receiptId.set(null);
    this.receipts.set([]);
    this.error.set('');
    if (material === null) {
      this.receiptsLoading.set(false);
      return;
    }
    await this.loadReceipts(material, generation);
  }
  private async loadReceipts(material: number, generation = ++this.generation) {
    this.receiptsLoading.set(true);
    try {
      const receipts = await firstValueFrom(
        this.api.usable(this.iam.requireLaboratoryId(), material),
      );
      if (generation === this.generation) this.receipts.set(receipts);
    } catch (error) {
      if (generation === this.generation) this.error.set(inventoryError(error));
    } finally {
      if (generation === this.generation) this.receiptsLoading.set(false);
    }
  }
  async consume(batchId: number, amount: number): Promise<boolean> {
    const receipt = this.selectedReceipt();
    if (!receipt || this.saving() || this.loading()) return false;
    const signature = JSON.stringify([batchId, receipt.id, amount, receipt.unit]);
    if (this.attempt?.signature !== signature)
      this.attempt = { signature, key: crypto.randomUUID() };
    const command: ConsumeRawMaterialBatchCommand = {
      laboratoryId: this.iam.requireLaboratoryId(),
      rawMaterialBatchId: receipt.id,
      productBatchId: batchId,
      amountUsed: amount,
      unit: receipt.unit,
      operationId: this.attempt.key,
    };
    this.saving.set(true);
    this.error.set('');
    this.saved.set(false);
    try {
      await firstValueFrom(
        this.api.consume(
          command.laboratoryId,
          command.rawMaterialBatchId,
          command.productBatchId,
          command.amountUsed,
          command.unit,
          command.operationId,
        ),
      );
      this.attempt = undefined;
      this.saved.set(true);
      await this.selectMaterial(null);
      await this.loadMaterials();
      return true;
    } catch (error) {
      await this.loadReceipts(receipt.rawMaterialId);
      this.error.set(inventoryError(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
