import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom, retry } from 'rxjs';
import { BatchApi } from '../infrastructure/batch-api';
import { Batch } from '../domain/model/batch.entity';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';
import { CreateBatchCommand } from '../domain/model/create-batch.command';
import { ReleaseBatchCommand } from '../domain/model/release-batch.command';
import { RejectBatchCommand } from '../domain/model/reject-batch.command';
import { LinkRawMaterialCommand } from '../domain/model/link-raw-material.command';
import {
  CreateBatchRequest,
  ReleaseBatchRequest,
  RejectBatchRequest,
} from '../infrastructure/batch.request';
import { LinkRawMaterialRequest } from '../infrastructure/raw-material-usage.request';

/**
 * Signal-based application store for the Batch bounded context.
 */
@Injectable({ providedIn: 'root' })
export class BatchStore {
  private readonly api = inject(BatchApi);
  readonly isLinking = signal(false);

  private readonly _batches = signal<Batch[]>([]);
  private readonly _currentBatchUsage = signal<RawMaterialUsage[]>([]);
  private readonly _selectedBatch = signal<Batch | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMsg = signal<string | null>(null);

  readonly batches = this._batches.asReadonly();
  readonly currentBatchUsage = this._currentBatchUsage.asReadonly();
  readonly selectedBatch = this._selectedBatch.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMsg = this._successMsg.asReadonly();

  readonly pendingBatches = computed(() =>
    this._batches().filter((batch) => batch.status === 'PENDING' || batch.status === 'IN_PROGRESS'),
  );

  readonly finishedBatches = computed(() =>
    this._batches().filter((batch) => batch.status === 'RELEASED' || batch.status === 'REJECTED'),
  );

  loadBatchById(batchId: number): void {
    this.startRequest();

    this.api
      .getBatchById(batchId)
      .pipe(retry(2))
      .subscribe({
        next: (batch) => {
          this._selectedBatch.set(batch);
          this.upsertBatch(batch);
          this.finishRequest();
        },
        error: (error) => this.failRequest(error, 'Failed to load batch detail'),
      });
  }

  loadBatches(labId: number): void {
    this.startRequest();

    this.api
      .getBatches(labId)
      .pipe(retry(2))
      .subscribe({
        next: (batches) => {
          this._batches.set(batches);
          this.finishRequest();
        },
        error: (error) => this.failRequest(error, 'Failed to load batch list'),
      });
  }

  createBatch(command: CreateBatchCommand): void {
    this.startRequest();

    const request = this.toCreateBatchRequest(command);

    this.api.createBatch(request).subscribe({
      next: (batch) => {
        this._batches.update((list) => [...list, batch]);
        this._selectedBatch.set(batch);
        this._successMsg.set('Batch created successfully');
        this.finishRequest();
      },
      error: (error) => this.failRequest(error, 'Failed to create batch'),
    });
  }

  releaseBatch(batchId: number, command: ReleaseBatchCommand): void {
    this.startRequest();

    const request = this.toReleaseBatchRequest(command);

    this.api.releaseBatch(batchId, request).subscribe({
      next: (updatedBatch) => {
        this.upsertBatch(updatedBatch);
        this._selectedBatch.set(updatedBatch);
        this._successMsg.set('Batch released successfully');
        this.finishRequest();
      },
      error: (error) => this.failRequest(error, 'Failed to release batch'),
    });
  }

  rejectBatch(batchId: number, command: RejectBatchCommand): void {
    this.startRequest();

    const request = this.toRejectBatchRequest(command);

    this.api.rejectBatch(batchId, request).subscribe({
      next: (updatedBatch) => {
        this.upsertBatch(updatedBatch);
        this._selectedBatch.set(updatedBatch);
        this._successMsg.set('Batch rejected successfully');
        this.finishRequest();
      },
      error: (error) => this.failRequest(error, 'Failed to reject batch'),
    });
  }

  loadBatchUsage(batchId: number): void {
    this.startRequest();

    this.api
      .getRawMaterialUsage(batchId)
      .pipe(retry(2))
      .subscribe({
        next: (usage) => {
          this._currentBatchUsage.set(usage);
          this.finishRequest();
        },
        error: (error) => this.failRequest(error, 'Failed to load material usage'),
      });
  }

  async linkMaterial(batchId: number, command: LinkRawMaterialCommand): Promise<boolean> {
    if (this.isLinking()) return false;
    this.isLinking.set(true);
    this.startRequest();
    try {
      const usage = await firstValueFrom(this.api.linkRawMaterial(batchId, this.toLinkRawMaterialRequest(command)));
      this._currentBatchUsage.update(list => [...list, usage]);
      this._successMsg.set('batch-usage.saved');
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this._error.set('batch-usage.errors.stock-changed');
      } else if (error instanceof HttpErrorResponse && error.status === 400) {
        this._error.set(error.error?.details ?? 'batch-usage.errors.invalid');
      } else {
        this._error.set('batch-usage.errors.failed');
      }
      return false;
    } finally {
      this.isLinking.set(false);
      this.finishRequest();
    }
  }

  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  private toCreateBatchRequest(command: CreateBatchCommand): CreateBatchRequest {
    return {
      labId: command.labId,
      productId: command.productId,
      batchNumber: command.batchNumber,
      quantity: command.quantity,
      unit: command.unit,
      startDate: command.startDate,
      notes: command.notes,
    };
  }

  private toReleaseBatchRequest(command: ReleaseBatchCommand): ReleaseBatchRequest {
    return {
      status: 'RELEASED',
      releaseDate: command.releaseDate,
      notes: command.notes,
    };
  }

  private toRejectBatchRequest(command: RejectBatchCommand): RejectBatchRequest {
    return {
      status: 'REJECTED',
      rejectionDate: command.rejectionDate,
      reason: command.reason,
    };
  }

  private toLinkRawMaterialRequest(command: LinkRawMaterialCommand): LinkRawMaterialRequest {
    return {
      rawMaterialId: command.rawMaterialId,
      quantityUsed: command.quantityUsed,
      unit: command.unit,
    };
  }

  private upsertBatch(batch: Batch): void {
    this._batches.update((list) => {
      const exists = list.some((item) => item.id === batch.id);
      return exists ? list.map((item) => (item.id === batch.id ? batch : item)) : [...list, batch];
    });
  }

  private startRequest(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);
  }

  private finishRequest(): void {
    this._isLoading.set(false);
  }

  private failRequest(error: unknown, fallback: string): void {
    this._error.set(this.formatError(error, fallback));
    this._isLoading.set(false);
  }

  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not Found`
        : error.message;
    }

    return fallback;
  }
}
