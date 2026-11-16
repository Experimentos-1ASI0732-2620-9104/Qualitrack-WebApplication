import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import {
  RawMaterialBatch,
  RawMaterialBatchStatus,
} from '../../../domain/model/raw-material-batch.entity';

/** Controls of the form that reviews a reception. */
export type BatchReviewFormGroup = FormGroup<{
  status: FormControl<RawMaterialBatchStatus>;
  reason: FormControl<string>;
}>;

/**
 * Form with the quality decision about a reception.
 *
 * @remarks
 * Offers only the decisions that apply: an expired lot cannot be released, and a released one can be observed.
 */
@Component({
  selector: 'app-batch-review-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './batch-review-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './batch-review-form.css',
})
export class BatchReviewForm {
  /** Reception under review. */
  readonly receipt = input.required<RawMaterialBatch>();

  /** Form owned by the view. */
  readonly form = input.required<BatchReviewFormGroup>();

  /** Whether a change is being saved. */
  readonly saving = input(false);

  /** The user confirmed the decision. */
  readonly confirmRequested = output<void>();

  /** The user closed the form without deciding. */
  readonly cancelRequested = output<void>();
}
