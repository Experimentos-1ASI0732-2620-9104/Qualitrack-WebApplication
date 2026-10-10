import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  DatePipe,
  DecimalPipe
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { BatchStatus } from '../../../domain/model/batch.entity';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Batches of every product of the laboratory, newest first.
 *
 * @remarks
 * Batches are created from their product; this list only helps to find them. Batches registered before
 * environments existed are listed without a link until they are assigned to an environment.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './batch-list.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchList implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);

  /**
   * Statuses offered by the status filter.
   */
  protected readonly statuses: BatchStatus[] = ['PENDING', 'IN_PROGRESS', 'RELEASED', 'REJECTED'];

  /**
   * Text typed in the search box.
   */
  protected readonly search = signal('');

  /**
   * Status selected in the filter; empty means every status.
   */
  protected readonly status = signal<BatchStatus | ''>('');

  /**
   * Batches that match the selected status and contain the search text in their number or product name.
   */
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.store
      .batches()
      .filter(
        (batch) =>
          (!this.status() || batch.status === this.status()) &&
          `${batch.batchNumber} ${batch.productName}`.toLowerCase().includes(term),
      );
  });

  /**
   * Lifecycle hook that loads the batches of the laboratory.
   */
  ngOnInit(): void {
    this.refresh();
  }

  /**
   * Reloads the batches of the laboratory.
   */
  protected refresh(): void {
    this.store.loadBatches(this.iam.requireLaboratoryId());
  }

  /**
   * Builds the translation key suffix of a batch status (e.g., `IN_PROGRESS` becomes `in-progress`).
   *
   * @param status - The batch status.
   * @returns The key suffix.
   */
  protected statusKey(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }
}
