import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';

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
  ],
  templateUrl: './inventory-catalogue.html',
  styleUrl: '../inventory.css',
})
export class InventoryCatalogue implements OnInit {
  readonly store = inject(InventoryStore);
  readonly search = signal('');
  readonly lowOnly = signal(false);
  readonly importing = signal(false);
  readonly filtered = computed(() =>
    this.store
      .materials()
      .filter(
        (material) =>
          (material.name + ' ' + material.code)
            .toLowerCase()
            .includes(this.search().toLowerCase()) &&
          (!this.lowOnly() || material.usableStock < material.minimumStock),
      ),
  );
  readonly lowCount = computed(
    () =>
      this.store.materials().filter((material) => material.usableStock < material.minimumStock)
        .length,
  );
  ngOnInit() {
    void this.store.load();
  }
  async showImports() {
    this.importing.set(!this.importing());
    if (this.importing()) await this.store.loadLegacy();
  }
  async import(id: number) {
    if (await this.store.importMaterial(id)) await this.store.loadLegacy();
  }
}
