import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryUnit } from '../../../domain/model/raw-material.entity';
import { stockQuantityValidator } from '../../../../shared/presentation/validators/stock-quantity.validator';

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
/** Registers a raw material in the environment taken from the route (US35). */
export class RegisterMaterial implements OnInit {
  readonly store = inject(InventoryStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected catalogueLink: (string | number)[] = ['/inventory'];
  readonly units: InventoryUnit[] = ['kg', 'g', 'L', 'mL', 'units'];
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    unit: ['kg' as InventoryUnit, Validators.required],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    const environmentId = Number(this.route.snapshot.paramMap.get('environmentId'));
    this.store.environmentId.set(environmentId);
    this.catalogueLink = ['/inventory/environments', environmentId, 'raw-materials'];
  }

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
      await this.router.navigate(this.catalogueLink);
    }
  }
}
