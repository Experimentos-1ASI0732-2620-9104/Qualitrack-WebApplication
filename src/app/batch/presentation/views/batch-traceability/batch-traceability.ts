import {
  Component,
  inject
} from '@angular/core';
import {
  DatePipe,
  DecimalPipe
} from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';

/**
 * Consolidated traceability of the selected batch: what it consumed, which equipment and staff
 * took part, where it is stored and how it was closed.
 *
 * @remarks
 * It is a read-only view of the traceability kept by {@link BatchStore}; the detail view loads it.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-traceability',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './batch-traceability.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchTraceabilityView {
  protected readonly store = inject(BatchStore);
}
