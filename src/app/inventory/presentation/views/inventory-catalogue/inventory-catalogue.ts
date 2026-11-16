import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { InventoryMaterialTable } from '../../components/inventory-material-table/inventory-material-table';
import { NearExpiryTable } from '../../components/near-expiry-table/near-expiry-table';
import { LegacyImportPanel } from '../../components/legacy-import-panel/legacy-import-panel';
import { PageHeader, PageTab } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';

/**
 * Raw material catalogue of an environment (US36), with low stock (US41) and near expiry (US42) views.
 */
@Component({
  selector: 'app-inventory-catalogue',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
    EnvironmentSelector,
    InventoryMaterialTable,
    NearExpiryTable,
    LegacyImportPanel,
    PageHeader,
    ListToolbar,
    FilterChip,
  ],
  templateUrl: './inventory-catalogue.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inventory-catalogue.css',
})
export class InventoryCatalogue implements OnInit {
  readonly store = inject(InventoryStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  readonly search = signal('');
  readonly lowOnly = signal(false);
  readonly importing = signal(false);
  readonly selectedTabIndex = signal(0);

  /** Views of the inventory of an environment: its catalogue and the lots close to expiring. */
  protected readonly tabs: readonly PageTab[] = [
    { labelKey: 'inventory.catalogue', id: 'catalogue' },
    { labelKey: 'inventory.nearExpiry', id: 'near-expiry' },
  ];

  /**
   * Returns raw materials matching the current search
   * and low-stock filters.
   *
   * The search is case-insensitive and ignores leading
   * and trailing whitespace.
   */
  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();

    const materials = this.lowOnly() ? this.store.lowStockMaterials() : this.store.materials();

    if (!query) {
      return materials;
    }

    return materials.filter((material) =>
      `${material.name} ${material.code}`.toLowerCase().includes(query),
    );
  });

  /**
   * Whether the materials of the current view are still being read.
   *
   * @remarks
   * While the low-stock answer has not arrived, the view says so instead of showing an empty list.
   */
  readonly waiting = computed(
    () => this.store.loading() || (this.lowOnly() && this.store.lowStockLoading()),
  );

  readonly materialNames = computed(
    () => new Map(this.store.materials().map((material) => [material.id, material.name])),
  );
  ngOnInit() {
    void this.store.loadEnvironments();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(async (params) => {
      const environmentId = Number(params.get('environmentId'));
      this.lowOnly.set(false);
      this.selectedTabIndex.set(0);
      this.importing.set(false);
      // Only environments the account can open become the default one.
      if (await this.store.load(environmentId)) this.store.rememberEnvironment(environmentId);
    });
  }
  changeEnvironment(environmentId: number) {
    void this.router.navigate(['/inventory/environments', environmentId, 'raw-materials']);
  }

  /**
   * Reloads the current environment inventory and refreshes
   * the active catalogue filters.
   *
   * Filter requests are only started when the main inventory
   * reload completes successfully for the same environment.
   */
  async reload(): Promise<void> {
    const environmentId = this.store.environmentId();

    if (environmentId === null) return;

    const loaded = await this.store.load(environmentId);

    if (!loaded || this.store.environmentId() !== environmentId) return;

    const requests: Promise<void>[] = [];

    if (this.lowOnly()) {
      requests.push(this.store.loadLowStock());
    }

    if (this.selectedTabIndex() === 1) {
      requests.push(this.store.loadNearExpiry());
    }

    await Promise.all(requests);
  }

  /**
   * Enables or disables the low-stock catalogue filter.
   *
   * The UI state updates immediately while the matching
   * materials are requested asynchronously.
   */
  toggleLowOnly(checked: boolean): void {
    this.lowOnly.set(checked);
    if (checked) {
      void this.store.loadLowStock();
    }
  }

  /**
   * Changes the active catalogue tab and loads near-expiry
   * batches when the corresponding tab is selected.
   */
  selectTab(index: number): void {
    this.selectedTabIndex.set(index);

    if (index === 1 && this.store.environmentId() !== null) {
      void this.store.loadNearExpiry();
    }
  }

  async showImports() {
    this.importing.set(!this.importing());
    if (this.importing()) await this.store.loadLegacy();
  }
  async import(id: number) {
    if (await this.store.importMaterial(id)) await this.store.loadLegacy();
  }
}
