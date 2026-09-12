import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { CreateProductCommand } from '../../../domain/model/create-product.command';

/**
 * Component responsible for creating pharmaceutical products.
 *
 * @remarks
 * This presentation component captures product catalog information through a
 * reactive form and dispatches a create product command to the Laboratory store.
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Form builder used to create the product form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Reactive form used to capture product data.
   */
  protected readonly form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.required],
    specifications: ['', Validators.required],
  });

  /**
   * Retrieves the current laboratory ID from the authenticated context.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Submits the product form and dispatches a create product command.
   */
  protected onSubmit(): void {
    if (this.form.invalid) return;

    const command: CreateProductCommand = {
      laboratoryId: this.currentLaboratoryId,
      ...this.form.getRawValue(),
    };

    this.store.createProduct(this.currentLaboratoryId, command);
    this.router.navigate(['/laboratories/product-catalog']);
  }

  /**
   * Cancels product creation and returns to the product catalog.
   */
  protected onCancel(): void {
    this.router.navigate(['/laboratories/product-catalog']);
  }
}
