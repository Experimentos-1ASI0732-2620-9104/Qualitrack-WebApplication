import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { BatchStatus } from '../../../domain/model/batch.entity';
import { IamStore } from '../../../../iam/application/iam.store';
import { EmptyState } from '../../../../shared/presentation/components/empty-state/empty-state';
import {
  BatchFilter,
  EMPTY_BATCH_FILTER,
  filterBatches,
  isBatchFilterApplied,
} from '../../batch-filter';
import { BatchFilters } from '../../components/batch-filters/batch-filters';
import { BatchKpiCards } from '../../components/batch-kpi-cards/batch-kpi-cards';
import { BatchTable } from '../../components/batch-table/batch-table';
import { BATCH_TABS } from '../../batch-tabs';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';

/**
 * Batches of every product of the laboratory, newest first.
 *
 * @remarks
 * Batches are created from their product; this list only helps to find them. The indicators count the batches of
 * each status among those that meet the other criteria, and also filter the list by status. Batches registered
 * before environments existed are listed without a link until they are assigned to an environment.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [
    PageHeader,
    ListToolbar,
    EnvironmentSelector,
    BatchFilters,
    BatchKpiCards,
    BatchTable,
    EmptyState,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './batch-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-list.css',
})
export class BatchList implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);

  /**
   * Criteria of the list.
   */
  protected readonly filter = signal<BatchFilter>({ ...EMPTY_BATCH_FILTER });

  /**
   * Batches that meet every criterion but the status; the indicators count them.
   */
  protected readonly inContext = computed(() =>
    filterBatches(this.store.batches(), { ...this.filter(), status: '' }),
  );

  /**
   * Batches that meet every criterion.
   */
  protected readonly filtered = computed(() => filterBatches(this.store.batches(), this.filter()));

  /**
   * Whether any criterion hides batches.
   */
  protected readonly filterApplied = computed(() => isBatchFilterApplied(this.filter()));

  /** Operations of the module. */
  protected readonly tabs = BATCH_TABS;

  /** How many filters of the folding row narrow the list: the status, the text and the period. */
  protected readonly activeFilters = computed(() => {
    const filter = this.filter();
    return (filter.status ? 1 : 0) + (filter.search.trim() ? 1 : 0) + (filter.from || filter.to ? 1 : 0);
  });

  /**
   * Environments that have batches, offered by the environment filter.
   */
  protected readonly environments = computed(() => {
    const ids = new Set(this.store.batches().map((batch) => batch.environmentId));
    return this.store.environments().filter((environment) => ids.has(environment.id));
  });

  /**
   * Lifecycle hook that loads the batches and the environments of the laboratory.
   */
  ngOnInit(): void {
    this.refresh();
    void this.store.loadEnvironments();
  }

  /**
   * Reloads the batches of the laboratory.
   */
  protected refresh(): void {
    this.store.loadBatches(this.iam.requireLaboratoryId());
  }

  /**
   * Shows only the batches of a status, as chosen through an indicator.
   *
   * @param status - The status, or empty for every status
   */
  /**
   * Changes part of the filter of the list.
   *
   * @param changes - The criteria that change
   */
  protected patchFilter(changes: Partial<BatchFilter>): void {
    this.filter.update((filter) => ({ ...filter, ...changes }));
  }

  protected chooseStatus(status: BatchStatus | ''): void {
    this.filter.update((filter) => ({ ...filter, status }));
  }

  /**
   * Shows every batch again.
   */
  protected clearFilters(): void {
    this.filter.set({ ...EMPTY_BATCH_FILTER });
  }
}
