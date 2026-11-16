import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryMovement } from '../../../domain/model/inventory-movement.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Movements of a raw material: what changed its balance, who did it and which production batch it went to.
 */
@Component({
  selector: 'app-inventory-movements-table',
  standalone: true,
  imports: [TablePaginator, DecimalPipe, RouterLink, TranslatePipe, DateTimePipe],
  templateUrl: './inventory-movements-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './inventory-movements-table.css',
})
export class InventoryMovementsTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly movementPage = paginate(() => this.movements());

  /** Movements to show, one per row. */
  readonly movements = input.required<readonly InventoryMovement[]>();
}
