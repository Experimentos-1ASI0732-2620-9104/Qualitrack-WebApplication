import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RawMaterialHistoryStore } from '../../../application/raw-material-history.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Component that shows a raw material and the history of its usages in production batches.
 *
 * @remarks
 * The raw material is read from the route parameter `id`; the history is reloaded whenever
 * that parameter changes.
 */
@Component({
  selector: 'app-raw-material-detail', standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule],
  providers: [RawMaterialHistoryStore],
  templateUrl: './raw-material-detail.html', styleUrl: './raw-material-detail.css',
})
export class RawMaterialDetail implements OnInit {
  /**
   * Store that loads the raw material and its usage history.
   */
  protected readonly store = inject(RawMaterialHistoryStore);

  /**
   * Current route, which carries the identifier of the raw material.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Store that exposes the laboratory of the authenticated session.
   */
  private readonly iam = inject(IamStore);

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
    this.params.subscribe(params => { this.materialId = Number(params.get('id')); this.reload(); });
  }

  /**
   * Loads again the history of the current raw material.
   */
  protected reload(): void {
    this.store.load(this.iam.requireLaboratoryId(), this.materialId);
  }
}
