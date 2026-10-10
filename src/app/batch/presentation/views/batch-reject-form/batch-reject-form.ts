import {
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { localIsoDate } from '../../../../shared/presentation/utils/local-date';
import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';

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
    TranslateModule,
  ],
  templateUrl: './batch-reject-form.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
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
    rejectionDate: [localIsoDate(), Validators.required],
    reason: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(500)]],
  });

  /**
   * Lifecycle hook that reads the route parameters.
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
