import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RawMaterial } from '../../../domain/model/raw-material.entity';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Raw materials of the catalogue, with a link to the detail of each one and a mark on low usable stock.
 */
@Component({
  selector: 'app-inventory-material-table',
  standalone: true,
  imports: [TablePaginator, DecimalPipe, RouterLink, TranslatePipe],
  templateUrl: './inventory-material-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './inventory-material-table.css',
})
export class InventoryMaterialTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly materialPage = paginate(() => this.materials());

  /** Raw materials to show, one per row. */
  readonly materials = input.required<readonly RawMaterial[]>();

  /** Environment of the catalogue, for the links to the materials. */
  readonly environmentId = input.required<number | null>();
}
