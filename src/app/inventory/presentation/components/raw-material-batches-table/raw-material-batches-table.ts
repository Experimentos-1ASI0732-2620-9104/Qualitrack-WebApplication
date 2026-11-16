import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { StorageContainer } from '../../../domain/model/storage-container.entity';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Receptions of a raw material, with their container, their state and the actions the user can take on them.
 */
@Component({
  selector: 'app-raw-material-batches-table',
  standalone: true,
  imports: [TablePaginator, DecimalPipe, RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './raw-material-batches-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './raw-material-batches-table.css',
})
export class RawMaterialBatchesTable {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly receiptPage = paginate(() => this.receipts());

  /** Receptions to show, one per row. */
  readonly receipts = input.required<readonly RawMaterialBatch[]>();

  /** Containers of the environment, to name the one that holds each reception. */
  readonly containers = input.required<readonly StorageContainer[]>();

  /** Environment of the raw material, for the link to the conditions of a container. */
  readonly environmentId = input<number | null>(null);

  /** Whether the user can operate, which allows storing a reception. */
  readonly canOperate = input(false);

  /** Whether the user can make quality decisions, which allows reviewing a reception. */
  readonly canReview = input(false);

  /** Whether the environment keeps its lots in monitored containers. */
  readonly storesInContainers = input(false);

  /** Whether a change is being saved. */
  readonly saving = input(false);

  /** The user asked to store a reception in a container. */
  readonly storageRequested = output<RawMaterialBatch>();

  /** The user asked to review a reception. */
  readonly reviewRequested = output<RawMaterialBatch>();

  /**
   * Name of a container of the environment.
   *
   * @param containerMonitorId - Identifier of the container
   * @returns The name, or null when the container is not among those of the environment
   */
  protected containerName(containerMonitorId: number): string | null {
    return this.containers().find((container) => container.id === containerMonitorId)?.name ?? null;
  }
}
