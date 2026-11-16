import { Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import {
  afterDateValidator,
  MIN_DATE,
  minDateValidator,
  noFutureDateValidator,
} from '../../../../shared/presentation/validators/date.validators';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';
import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchPath } from '../../../domain/model/batch-path';

/**
 * Rejects a batch and keeps the reason.
 *
 * @remarks
 * Only quality managers and administrators can reject a batch; for other users the form shows a notice and
 * the submit button is disabled. When the batch is rejected, the view returns to its detail.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-reject-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './batch-reject-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-reject-form.css',
})
export class BatchRejectForm implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /**
   * Laboratory, environment and product of the batch, taken from the route.
   */
  protected path!: BatchPath;

  /**
   * Identifier of the batch, taken from the route.
   */
  protected batchId = 0;

  /**
   * Form of the rejection: date (today by default) and reason (between 15 and 500 characters).
   */
  protected readonly form = this.fb.nonNullable.group({
    rejectionDate: [
      todayInLima(),
      [
        Validators.required,
        minDateValidator(),
        noFutureDateValidator(),
        afterDateValidator(() => this.store.selectedBatch()?.startDate),
      ],
    ],
    reason: [
      '',
      [Validators.required, notBlankValidator, Validators.minLength(15), Validators.maxLength(500)],
    ],
  });

  /**
   * Earliest date accepted by the date input: 2020 or the start of the batch, whichever is later.
   *
   * @returns The date as yyyy-MM-dd.
   */
  protected get minDate(): string {
    const start = this.store.selectedBatch()?.startDate ?? '';
    return start > MIN_DATE ? start : MIN_DATE;
  }

  /**
   * Latest date accepted by the date input: today in Lima.
   *
   * @returns The date as yyyy-MM-dd.
   */
  protected get maxDate(): string {
    return todayInLima();
  }

  /**
   * Checks the date again when the batch, and so its start date, finishes loading.
   */
  constructor() {
    effect(() => {
      this.store.selectedBatch();
      this.form.controls.rejectionDate.updateValueAndValidity();
    });
  }

  /**
   * Lifecycle hook that reads the route parameters and loads the batch to know its start date.
   */
  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    this.path = {
      laboratoryId: this.iam.requireLaboratoryId(),
      environmentId: Number(params.get('environmentId')),
      productId: Number(params.get('productId')),
    };
    this.batchId = Number(params.get('batchId'));
    this.store.clearMessages();
    if (this.store.selectedBatch()?.id !== this.batchId)
      void this.store.loadBatch(this.path, this.batchId);
  }

  /**
   * Route of the detail of the batch.
   *
   * @returns The router link segments of the batch.
   */
  protected get batchLink(): (string | number)[] {
    return [
      '/batches/environments',
      this.path.environmentId,
      'products',
      this.path.productId,
      'batches',
      this.batchId,
    ];
  }

  /**
   * Validates the form, rejects the batch and returns to its detail.
   */
  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (
      await this.store.rejectBatch(this.path, this.batchId, {
        rejectionDate: value.rejectionDate,
        reason: value.reason.trim(),
      })
    ) {
      await this.router.navigate(this.batchLink);
    }
  }
}
