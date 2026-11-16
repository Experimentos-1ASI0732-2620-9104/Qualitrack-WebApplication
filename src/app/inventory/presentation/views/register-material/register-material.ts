import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryUnit } from '../../../domain/model/raw-material.entity';
import { MAX_STOCK } from '../../../domain/model/stock-limits';
import { codeValidator } from '../../../../shared/presentation/validators/code.validator';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';
import { stockQuantityValidator } from '../../../../shared/presentation/validators/stock-quantity.validator';

@Component({
  selector: 'app-register-material',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './register-material.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
  /** Unit control, kept apart because the rules of the minimum stock depend on it. */
  private readonly unit = this.fb.nonNullable.control('kg' as InventoryUnit, Validators.required);
  readonly maxStock = MAX_STOCK;
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, notBlankValidator, codeValidator, Validators.maxLength(50)]],
    name: ['', [Validators.required, notBlankValidator, Validators.maxLength(150)]],
    unit: this.unit,
    minimumStock: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(MAX_STOCK),
        (control: AbstractControl) => stockQuantityValidator(this.unit.value)(control),
      ],
    ],
  });

  constructor() {
    this.unit.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.minimumStock.updateValueAndValidity());
  }

  ngOnInit() {
    const environmentId = Number(this.route.snapshot.paramMap.get('environmentId'));
    this.store.environmentId.set(environmentId);
    this.catalogueLink = ['/inventory/environments', environmentId, 'raw-materials'];
  }

  async save() {
    if (this.store.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (await this.store.saveMaterial(this.form.getRawValue())) {
      await this.router.navigate(this.catalogueLink);
    }
  }
}
