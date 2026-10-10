import { HttpErrorResponse } from '@angular/common/http';
import {
  Injectable,
  inject,
  signal
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../shared/infrastructure/api-error';
import { IamStore } from '../../iam/application/iam.store';
import { BatchApi } from '../infrastructure/batch-api';
import { BatchPath } from '../infrastructure/batch-api-endpoint';
import { Batch } from '../domain/model/batch.entity';
import { BatchTraceability } from '../domain/model/batch-traceability.entity';
import { CreateBatchCommand } from '../domain/model/create-batch.command';
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

  // Signals
  private readonly _batches = signal<Batch[]>([]);
  private readonly _productBatches = signal<Batch[]>([]);
  private readonly _selectedBatch = signal<Batch | null>(null);
  private readonly _traceability = signal<BatchTraceability | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMsg = signal<string | null>(null);

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
}
