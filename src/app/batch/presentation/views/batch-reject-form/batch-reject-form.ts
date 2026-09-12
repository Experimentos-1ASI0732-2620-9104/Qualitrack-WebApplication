import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { BatchStore } from '../../../application/batch.store';
import { RejectBatchCommand } from '../../../domain/model/reject-batch.command';

/**
 * Component responsible for rejecting a production batch.
 *
 * @remarks
 * This standalone presentation component reads the batch identifier from the
 * route, collects rejection information through a reactive form, and sends a
 * {@link RejectBatchCommand} to the batch application store.
 *
 * The rejection operation records a BPM/GMP-relevant justification when a batch
 * fails quality control or cannot be released for distribution.
 */
@Component({
  selector: 'app-batch-reject-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    RouterLink,
  ],
  templateUrl: './batch-reject-form.html',
  styleUrl: './batch-reject-form.css',
})
export class BatchRejectForm implements OnInit {
  /**
   * FormBuilder used to create and configure the reactive form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Activated route used to read the batch identifier from the URL.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Router used to return to the batch list after submitting the form.
   */
  private readonly router = inject(Router);

  /**
   * Store responsible for batch lifecycle operations.
   */
  protected readonly store = inject(BatchStore);

  /**
   * Reactive form group for rejection data.
   */
  protected rejectForm!: FormGroup;

  /**
   * Unique numeric identifier of the batch being rejected.
   */
  protected batchId: number = 0;

  /**
   * Lifecycle hook that initializes the rejection form.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.batchId = idParam ? Number(idParam) : 0;

    this.rejectForm = this.fb.group({
      rejectionDate: [new Date().toISOString().substring(0, 10), Validators.required],
      reason: ['', [Validators.required, Validators.minLength(15)]],
    });
  }

  /**
   * Submits the rejection command for the current batch.
   */
  protected onSubmit(): void {
    if (this.rejectForm.invalid || !this.batchId) return;

    const command: RejectBatchCommand = {
      rejectionDate: this.rejectForm.value.rejectionDate,
      reason: this.rejectForm.value.reason,
    };

    this.store.rejectBatch(this.batchId, command);
    this.router.navigate(['/batches/batch-list']).then();
  }
}
