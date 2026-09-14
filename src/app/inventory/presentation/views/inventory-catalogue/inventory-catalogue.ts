import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryUnit } from '../../../domain/model/raw-material.entity';
import { stockQuantityValidator } from '../../../../shared/presentation/stock-quantity-validator';

@Component({
  selector: 'app-inventory-catalogue',
  standalone: true,
  providers: [InventoryStore],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    TranslateModule,
  ],
  templateUrl: './inventory-catalogue.html',
  styleUrl: '../inventory.css',
})
export class InventoryCatalogue implements OnInit {
  readonly store = inject(InventoryStore);
  private readonly fb = inject(FormBuilder);
  readonly search = signal('');
  readonly lowOnly = signal(false);
  readonly creating = signal(false);
  readonly importing = signal(false);
  readonly units: InventoryUnit[] = ['kg', 'g', 'L', 'mL', 'units'];
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
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    unit: ['kg' as InventoryUnit, Validators.required],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
  });
  ngOnInit() {
    void this.store.load();
  }
  async save() {
    this.form.controls.minimumStock.setValidators([
      Validators.required,
      Validators.min(0),
      stockQuantityValidator(this.form.controls.unit.value),
    ]);
    this.form.controls.minimumStock.updateValueAndValidity();
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (await this.store.saveMaterial(this.form.getRawValue())) {
      this.creating.set(false);
      this.form.reset();
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
