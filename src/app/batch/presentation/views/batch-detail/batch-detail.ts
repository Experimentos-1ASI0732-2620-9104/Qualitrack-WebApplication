import {
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import {
  DatePipe,
  DecimalPipe
} from '@angular/common';
import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';
import { RawMaterialUsageComponent } from '../raw-material-usage/raw-material-usage';
import { BatchParticipants } from '../batch-participants/batch-participants';
import { BatchTraceabilityView } from '../batch-traceability/batch-traceability';
import { BatchStorage } from '../batch-storage/batch-storage';

/**
 * Detail of a product batch: its data, the raw materials it consumed, the equipment and
 * staff that took part, the container where it is stored, its traceability and
 * the release or rejection.
 *
 * @remarks
 * The batch is identified by the route (environment, product and batch). The component reloads it whenever
 * the route parameters change.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-detail',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    RawMaterialUsageComponent,
    BatchParticipants,
    BatchTraceabilityView,
    BatchStorage,
  ],
  templateUrl: './batch-detail.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchDetail implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);

  /**
   * Laboratory, environment and product of the batch, taken from the route.
   */
  protected path: BatchPath | null = null;

  /**
   * Identifier of the batch, taken from the route.
   */
  protected batchId = 0;

  /**
   * Lifecycle hook that reads the route parameters and loads the batch with its traceability.
   */
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.path = {
        laboratoryId: this.iam.requireLaboratoryId(),
        environmentId: Number(params.get('environmentId')),
        productId: Number(params.get('productId')),
      };
      this.batchId = Number(params.get('batchId'));
      this.store.clearMessages();
      void this.store.loadBatch(this.path, this.batchId);
    });
  }

  /**
   * Route of the product the batch belongs to.
   *
   * @returns The router link segments of the product.
   */
  protected get productLink(): (string | number)[] {
    return [
      '/batches/environments',
      this.path?.environmentId ?? 0,
      'products',
      this.path?.productId ?? 0,
    ];
  }

  /**
   * Route of the release or rejection form of a batch.
   *
   * @param batchId - The batch identifier.
   * @param decision - The decision to take: `release` or `reject`.
   * @returns The router link segments of the form.
   */
  protected decisionLink(batchId: number, decision: 'release' | 'reject'): (string | number)[] {
    return [...this.productLink, 'batches', batchId, decision];
  }

  /**
   * Builds the translation key suffix of a batch status (e.g., `IN_PROGRESS` becomes `in-progress`).
   *
   * @param status - The batch status.
   * @returns The key suffix, or `unknown` when there is no status.
   */
  protected statusKey(status?: string): string {
    return status ? status.toLowerCase().replace(/_/g, '-') : 'unknown';
  }
}
