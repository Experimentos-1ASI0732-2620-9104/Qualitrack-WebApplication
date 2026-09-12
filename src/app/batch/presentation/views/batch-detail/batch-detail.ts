import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { BatchStore } from '../../../application/batch.store';
import { Batch } from '../../../domain/model/batch.entity';
import { RawMaterialUsageComponent } from '../raw-material-usage/raw-material-usage';

/**
 * Component responsible for displaying production batch details.
 *
 * @remarks
 * This standalone presentation component loads a specific batch using the
 * identifier provided by the route. It displays the selected batch information
 * and embeds the raw material usage component to manage material traceability.
 *
 * The component also exposes helpers for normalizing backend status enum values
 * into CSS-friendly and i18n-friendly strings.
 */
@Component({
  selector: 'app-batch-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule,
    RawMaterialUsageComponent,
  ],
  templateUrl: './batch-detail.html',
  styleUrl: './batch-detail.css',
})
export class BatchDetail implements OnInit {
  /**
   * Activated route used to read the batch identifier from the URL.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Store responsible for batch detail and raw material usage state.
   */
  protected readonly store = inject(BatchStore);

  /**
   * Unique numeric identifier of the batch currently being viewed.
   */
  protected batchId: number = 0;

  /**
   * Lifecycle hook that loads batch detail and raw material usage data.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.batchId = idParam ? Number(idParam) : 0;

    if (this.batchId) {
      this.store.loadBatchById(this.batchId);
      this.store.loadBatchUsage(this.batchId);
    }
  }

  /**
   * Gets the current batch entity from selected state or the loaded collection.
   *
   * @returns The matching Batch domain entity, or undefined when it is not loaded yet
   */
  protected get currentBatch(): Batch | undefined {
    const selected = this.store.selectedBatch();

    return selected?.id === this.batchId
      ? selected
      : this.store.batches().find((batch) => batch.id === this.batchId);
  }

  /**
   * Maps a batch status value to the CSS class used by the detail view.
   *
   * @param status - Current lifecycle status of the batch
   * @returns CSS-friendly status value
   */
  protected getStatusClass(status?: string): string {
    return this.normalizeStatus(status);
  }

  /**
   * Maps a batch status value to the translation key suffix.
   *
   * @param status - Current lifecycle status of the batch
   * @returns Translation-key-friendly status value
   */
  protected getStatusKey(status?: string): string {
    return this.normalizeStatus(status);
  }

  /**
   * Normalizes backend enum values for CSS classes and i18n keys.
   *
   * @param status - Raw backend status value
   * @returns Lowercase status with underscores replaced by hyphens
   */
  private normalizeStatus(status?: string): string {
    return status ? status.toLowerCase().replace(/_/g, '-') : 'unknown';
  }
}
