import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { stockQuantityValidator } from '../../stock-quantity-validator';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { CreateRawMaterialCommand } from '../../../domain/model/create-raw-material.command';

/**
 * Component responsible for registering raw materials.
 *
 * @remarks
 * This presentation component captures raw material inventory and traceability
 * data through a reactive form, formats the expiration date, and dispatches a
 * create raw material command to the Laboratory store.
 */
@Component({
  selector: 'app-raw-material-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './raw-material-form.html',
  styleUrl: './raw-material-form.css',
})
export class RawMaterialForm {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Form builder used to create the raw material form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Available units of measurement for raw material stock.
   */
  protected readonly units = ['kg', 'g', 'L', 'mL', 'units'];

  /**
   * Reactive form used to capture raw material data.
   */
  protected readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    supplier: ['', Validators.required],
    batchNumber: ['', Validators.required],
    expirationDate: ['', Validators.required],
    quantityInStock: [null, [Validators.required, Validators.min(0)]],
    unit: ['', Validators.required],
    minimumStock: [null, [Validators.required, Validators.min(0)]],
  });

  /**
   * Retrieves the current laboratory ID from the authenticated context.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Submits the raw material form and dispatches a create raw material command.
   */
  constructor() {
    this.form.get('unit')!.valueChanges.pipe(takeUntilDestroyed()).subscribe(unit => {
      for (const name of ['quantityInStock', 'minimumStock']) {
        const field = this.form.get(name)!;
        field.setValidators([Validators.required, Validators.min(0), stockQuantityValidator(unit)]);
        field.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid || this.store.isLoading()) return;

    const value = this.form.getRawValue();

    const command: CreateRawMaterialCommand = {
      laboratoryId: this.currentLaboratoryId,
      ...value,
      expirationDate: new Date(value.expirationDate).toISOString().split('T')[0],
    };

    if (await this.store.createRawMaterial(this.currentLaboratoryId, command)) {
      await this.router.navigate(['/laboratories/raw-material-list']);
    }
  }

  /**
   * Cancels raw material registration and returns to the raw material list.
   */
  protected onCancel(): void {
    this.router.navigate(['/laboratories/raw-material-list']);
  }
}
