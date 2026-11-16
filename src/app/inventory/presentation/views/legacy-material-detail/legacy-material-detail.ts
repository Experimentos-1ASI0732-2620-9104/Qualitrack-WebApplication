import { Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { LegacyMaterialSummary } from '../../components/legacy-material-summary/legacy-material-summary';
import { LegacyConsumptionHistoryTable } from '../../components/legacy-consumption-history-table/legacy-consumption-history-table';

/**
 * Component that shows a raw material and the history of its usages in production batches.
 *
 * @remarks
 * The raw material is read from the route parameter `id`; the history is reloaded whenever
 * that parameter changes.
 */
@Component({
  selector: 'app-legacy-material-detail',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LegacyMaterialSummary,
    LegacyConsumptionHistoryTable
  ],
  templateUrl: './legacy-material-detail.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './legacy-material-detail.css',
})
export class LegacyMaterialDetail implements OnInit {
  /**
   * Store that loads the raw material and its usage history.
   */
  protected readonly store = inject(InventoryStore);

  /**
   * Current route, which carries the identifier of the raw material.
   */
  private readonly route = inject(ActivatedRoute);

  constructor() { inject(DestroyRef).onDestroy(() => this.store.clearLegacyDetail()); }

  /**
   * Route parameters, completed when the component is destroyed.
   */
  private readonly params = this.route.paramMap.pipe(takeUntilDestroyed());

  /**
   * Identifier of the raw material currently shown.
   */
  private materialId = 0;

  /**
   * Lifecycle hook that loads the history for every raw material identifier in the route.
   */
  ngOnInit(): void {
    this.params.subscribe((params) => {
      this.materialId = Number(params.get('id'));
      this.reload();
    });
  }

  /**
   * Loads again the history of the current raw material.
   */
  protected reload(): void {
    this.store.loadLegacyDetail(this.materialId);
  }
}
