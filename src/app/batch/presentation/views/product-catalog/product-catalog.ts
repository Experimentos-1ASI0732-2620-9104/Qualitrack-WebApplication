import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { BATCH_TABS } from '../../batch-tabs';

/** Status of the products the list leaves. */
type ProductStatusFilter = 'all' | 'active' | 'inactive';

/**
 * Pharmaceutical products of an environment, with registration for quality roles.
 *
 * @remarks
 * The environment is taken from the route and can be changed with the environment selector. The list can be
 * filtered by product code or name.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [
    TablePaginator,
    PageHeader,
    ListToolbar,
    FilterChip,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
    EnvironmentSelector,
  ],
  templateUrl: './product-catalog.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './product-catalog.css',
})
export class ProductCatalog implements OnInit {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly productPage = paginate(() => this.filtered());

  protected readonly store = inject(BatchStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);

  /**
   * Text typed in the search box.
   */
  protected readonly search = signal('');

  /**
   * Products whose code or name contain the search text.
   */
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    return this.store
      .products()
      .filter((product) => status === 'all' || product.active === (status === 'active'))
      .filter((product) => `${product.code} ${product.name}`.toLowerCase().includes(term));
  });

  /** Operations of the module. */
  protected readonly tabs = BATCH_TABS;

  /** Status of the products shown. */
  protected readonly status = signal<ProductStatusFilter>('all');

  /** Chips of the status, with the key of their name. */
  protected readonly statusOptions: readonly { value: ProductStatusFilter; labelKey: string }[] = [
    { value: 'all', labelKey: 'common.all' },
    { value: 'active', labelKey: 'common.active' },
    { value: 'inactive', labelKey: 'common.inactive' },
  ];

  /** How many products of the environment each chip leaves. */
  protected readonly counts = computed(() => {
    const products = this.store.products();
    const active = products.filter((product) => product.active).length;
    return { all: products.length, active, inactive: products.length - active };
  });

  /**
   * Lifecycle hook that loads the products of the environment of the route every time it changes.
   */
  ngOnInit(): void {
    void this.store.loadEnvironments();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(async (params) => {
      const environmentId = Number(params.get('environmentId'));
      this.search.set('');
      // Only environments the account can open become the default one.
      if (await this.store.loadProducts(environmentId))
        this.store.rememberProductionEnvironment(environmentId);
    });
  }

  /**
   * Reads the products of the chosen environment again.
   */
  protected refresh(): void {
    const environmentId = this.store.productEnvironmentId();

    if (environmentId !== null) {
      void this.store.loadProducts(environmentId);
    }
  }

  /**
   * Opens the products of another environment.
   *
   * @param environmentId - The environment selected in the selector.
   */
  protected changeEnvironment(environmentId: number): void {
    void this.router.navigate(['/batches/environments', environmentId, 'products']);
  }
}
