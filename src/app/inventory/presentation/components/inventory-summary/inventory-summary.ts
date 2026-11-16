import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RawMaterial } from '../../../domain/model/raw-material.entity';

/**
 * Stock figures of a raw material: usable, physical and minimum.
 */
@Component({
  selector: 'app-inventory-summary',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './inventory-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './inventory-summary.css',
})
export class InventorySummary {
  /** Raw material whose stock is shown. */
  readonly material = input.required<RawMaterial>();
}
