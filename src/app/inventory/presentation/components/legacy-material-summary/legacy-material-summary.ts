import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { LegacyMaterialSnapshot } from '../../../domain/model/legacy-material-snapshot.entity';

/**
 * Stock and identification of a raw material from before Inventory, with a warning when the stock is low.
 */
@Component({
  selector: 'app-legacy-material-summary',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, DateOnlyPipe],
  templateUrl: './legacy-material-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './legacy-material-summary.css',
})
export class LegacyMaterialSummary {
  /** Raw material to show. */
  readonly material = input.required<LegacyMaterialSnapshot>();
}
