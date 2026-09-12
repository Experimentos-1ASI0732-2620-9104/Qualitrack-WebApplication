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
import { ReleaseBatchCommand } from '../../../domain/model/release-batch.command';

/**
 * Component responsible for releasing a production batch.
 *
 * @remarks
 * This standalone presentation component reads the batch identifier from the
 * route, collects release information through a reactive form, and sends a
 * {@link ReleaseBatchCommand} to the batch application store.
 *
 * The release operation represents the approval of a batch after successful
 * quality control and BPM/GMP verification.
 */
@Component({
  selector: 'app-batch-release-form',
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
  templateUrl: './batch-release-form.html',
  styleUrl: './batch-release-form.css',
})
export class BatchReleaseForm implements OnInit {
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
   * Reactive form group for release data.
   */
  protected releaseForm!: FormGroup;

  /**
   * Unique numeric identifier of the batch being released.
   */
  protected batchId: number = 0;

  /**
   * Lifecycle hook that initializes the release form.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.batchId = idParam ? Number(idParam) : 0;

    this.releaseForm = this.fb.group({
      releaseDate: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  /**
   * Submits the release command for the current batch.
   */
  protected onSubmit(): void {
    if (this.releaseForm.invalid || !this.batchId) return;

    const command: ReleaseBatchCommand = {
      releaseDate: this.releaseForm.value.releaseDate,
      notes: this.releaseForm.value.notes,
    };

    this.store.releaseBatch(this.batchId, command);
    this.router.navigate(['/batches/batch-list']).then();
  }
}
