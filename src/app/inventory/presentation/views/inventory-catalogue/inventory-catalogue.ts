import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';

/**
 * Raw material catalogue of an environment (US36), with low stock (US41) and near expiry (US42) views.
 */
@Component({
  selector: 'app-inventory-catalogue',
  standalone: true,
  providers: [InventoryStore],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    TranslateModule,
    EnvironmentSelector,
  ],
  templateUrl: './inventory-catalogue.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class InventoryCatalogue implements OnInit {
  readonly store = inject(InventoryStore);
  private readonly environments = inject(EnvironmentStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  readonly search = signal('');
  readonly lowOnly = signal(false);
  readonly importing = signal(false);
  readonly showNearExpiry = signal(false);
  readonly filtered = computed(() =>
    (this.lowOnly() ? this.store.lowStockMaterials() : this.store.materials()).filter((material) =>
      (material.name + ' ' + material.code).toLowerCase().includes(this.search().toLowerCase()),
    ),
  );
  readonly materialNames = computed(
    () => new Map(this.store.materials().map((material) => [material.id, material.name])),
  );
  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(async (params) => {
      const environmentId = Number(params.get('environmentId'));
      this.lowOnly.set(false);
      this.showNearExpiry.set(false);
      this.importing.set(false);
      // Only environments the account can open become the default one.
      if (await this.store.load(environmentId)) this.environments.rememberEnvironment(environmentId);
    });
  }
  changeEnvironment(environmentId: number) {
    void this.router.navigate(['/inventory/environments', environmentId, 'raw-materials']);
  }
  reload() {
    const environmentId = this.store.environmentId();
    if (environmentId !== null) void this.store.load(environmentId);
  }
  async toggleLowOnly(checked: boolean) {
    if (checked) await this.store.loadLowStock();
    this.lowOnly.set(checked);
  }
  async toggleNearExpiry() {
    this.showNearExpiry.set(!this.showNearExpiry());
    if (this.showNearExpiry()) await this.store.loadNearExpiry();
  }
  async showImports() {
    this.importing.set(!this.importing());
    if (this.importing()) await this.store.loadLegacy();
  }
  async import(id: number) {
    if (await this.store.importMaterial(id)) await this.store.loadLegacy();
  }
}
