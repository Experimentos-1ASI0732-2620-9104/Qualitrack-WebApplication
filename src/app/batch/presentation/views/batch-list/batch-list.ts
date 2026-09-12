import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Component responsible for displaying the production batch collection.
 *
 * @remarks
 * This standalone presentation component renders manufacturing batches in a
 * tabular view. It obtains the current laboratory context from {@link IamStore}
 * and delegates batch loading operations to {@link BatchStore}.
 *
 * The component also exposes formatting helpers for status translation keys and
 * CSS classes, keeping the template free from repeated string manipulation.
 */
@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './batch-list.html',
  styleUrl: './batch-list.css',
})
export class BatchList implements OnInit {
  /**
   * Store responsible for batch state and operations.
   */
  protected readonly store = inject(BatchStore);

  /**
   * Store responsible for retrieving the active user or laboratory context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Columns rendered in the batches table.
   */
  protected readonly displayedColumns: string[] = [
    'batchNumber',
    'productName',
    'quantity',
    'status',
    'startDate',
    'actions',
  ];

  /**
   * Gets the active numeric laboratory identifier.
   *
   * @remarks
   * The current implementation uses the authenticated user identifier as the
   * laboratory context and falls back to 1 when no session context is available.
   */
  private get currentLabId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Lifecycle hook that initializes the batch collection.
   */
  ngOnInit(): void {
    this.store.loadBatches(this.currentLabId);
  }

  /**
   * Reloads the batch list from the backend API.
   */
  protected onRefresh(): void {
    this.store.loadBatches(this.currentLabId);
  }

  /**
   * Maps a batch status value to the CSS class used by the status chip.
   *
   * @param status - Current lifecycle status of the batch
   * @returns CSS-friendly status value
   */
  protected getStatusClass(status: string): string {
    return this.normalizeStatus(status);
  }

  /**
   * Maps a batch status value to the translation key suffix.
   *
   * @param status - Current lifecycle status of the batch
   * @returns Translation-key-friendly status value
   */
  protected getStatusKey(status: string): string {
    return this.normalizeStatus(status);
  }

  /**
   * Normalizes backend enum values for CSS classes and i18n keys.
   *
   * @param status - Raw backend status value
   * @returns Lowercase status with underscores replaced by hyphens
   */
  private normalizeStatus(status: string): string {
    return status ? status.toLowerCase().replace(/_/g, '-') : 'pending';
  }
}
