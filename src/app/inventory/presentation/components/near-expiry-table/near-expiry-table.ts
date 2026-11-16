import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Lots of raw material that are close to their expiration date.
 */
@Component({
  selector: 'app-near-expiry-table',
  standalone: true,
  imports: [TablePaginator, DecimalPipe, RouterLink, TranslatePipe],
  templateUrl: './near-expiry-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './near-expiry-table.css',
})
export class NearExpiryTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly lotPage = paginate(() => this.batches());

  /** Lots to show, one per row. */
  readonly batches = input.required<readonly RawMaterialBatch[]>();

  /** Names of the raw materials by identifier; a material without a name shows its identifier. */
  readonly materialNames = input.required<ReadonlyMap<number, string>>();

  /** Environment of the catalogue, for the links to the materials. */
  readonly environmentId = input.required<number | null>();
}
