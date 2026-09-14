import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryUnit } from '../../../domain/model/raw-material.entity';
import { stockQuantityValidator } from '../../../../shared/presentation/stock-quantity-validator';

@Component({
  selector: 'app-register-material',
  standalone: true,
  providers: [InventoryStore],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './register-material.html',
  styleUrl: './register-material.css',
})
export class RegisterMaterial {
  readonly store = inject(InventoryStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly units: InventoryUnit[] = ['kg', 'g', 'L', 'mL', 'units'];
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    unit: ['kg' as InventoryUnit, Validators.required],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
  });

  async save() {
    if (this.store.saving()) return;
    this.form.controls.minimumStock.setValidators([
      Validators.required,
      Validators.min(0),
      stockQuantityValidator(this.form.controls.unit.value),
    ]);
    this.form.controls.minimumStock.updateValueAndValidity();
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (await this.store.saveMaterial(this.form.getRawValue())) {
      await this.router.navigate(['/inventory/inventory-catalogue']);
    }
  }
}
