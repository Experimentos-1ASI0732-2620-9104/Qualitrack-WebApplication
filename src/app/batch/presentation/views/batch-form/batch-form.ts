import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { BatchStore } from '../../../application/batch.store';
import { LaboratoryStore } from '../../../../laboratory/application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { CreateBatchCommand } from '../../../domain/model/create-batch.command';

/**
 * Component responsible for registering new production batches.
 *
 * @remarks
 * This standalone presentation component manages the batch creation form. It
 * loads pharmaceutical products from the laboratory bounded context so the user
 * can select the product to manufacture, then sends a {@link CreateBatchCommand}
 * to the batch application store.
 *
 * The component includes the unit field required by the Batch domain entity and
 * backend resource contract.
 */
@Component({
  selector: 'app-batch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    TranslateModule,
    RouterLink,
  ],
  templateUrl: './batch-form.html',
  styleUrl: './batch-form.css',
})
export class BatchForm implements OnInit {
  /**
   * FormBuilder used to create and configure the reactive form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to return to the batch list after submitting the form.
   */
  private readonly router = inject(Router);

  /**
   * Store responsible for batch state and creation operations.
   */
  protected readonly store = inject(BatchStore);

  /**
   * Store responsible for loading pharmaceutical products from the laboratory context.
   */
  protected readonly labStore = inject(LaboratoryStore);

  /**
   * Store responsible for retrieving the active user or laboratory context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Available units of measurement for production batch quantities.
   */
  protected readonly units = ['units', 'kg', 'g', 'L', 'mL'];

  /**
   * Reactive form group for batch creation data.
   */
  protected batchForm!: FormGroup;

  /**
   * Gets the active numeric laboratory identifier.
   *
   * @remarks
   * The current implementation uses the authenticated user identifier as the
   * laboratory context and falls back to 1 when no session context is available.
   */
  private get currentLabId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Lifecycle hook that initializes the form and preloads product data.
   */
  ngOnInit(): void {
    this.labStore.loadProducts(this.currentLabId);

    this.batchForm = this.fb.group({
      productId: ['', Validators.required],
      batchNumber: ['', [Validators.required, Validators.pattern(/^LOT-\d{4}-\d{3}$/)]],
      quantity: [0, [Validators.required, Validators.min(1)]],
      unit: ['units', Validators.required],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: [''],
    });
  }

  /**
   * Creates a new production batch using the form values.
   */
  protected onSubmit(): void {
    if (this.batchForm.invalid) return;

    const command: CreateBatchCommand = {
      labId: this.currentLabId,
      productId: Number(this.batchForm.value.productId),
      batchNumber: this.batchForm.value.batchNumber,
      quantity: Number(this.batchForm.value.quantity),
      unit: this.batchForm.value.unit,
      startDate: this.batchForm.value.startDate,
      notes: this.batchForm.value.notes,
    };

    this.store.createBatch(command);
    this.router.navigate(['/batches/batch-list']).then();
  }
}
