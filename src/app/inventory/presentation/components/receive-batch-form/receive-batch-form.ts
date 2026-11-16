import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryUnit } from '../../../domain/model/raw-material.entity';
import { MAX_STOCK } from '../../../domain/model/stock-limits';

/** Controls of the form that registers a reception. */
export type ReceiveBatchFormGroup = FormGroup<{
  supplier: FormControl<string>;
  batchNumber: FormControl<string>;
  amount: FormControl<number>;
  receivedOn: FormControl<string>;
  expiresOn: FormControl<string>;
}>;

/**
 * Form that registers the reception of a lot of a raw material, which stays in quarantine until it is reviewed.
 *
 * @remarks
 * The view owns the form and its validators; this component only shows it and tells what the user asked for.
 */
@Component({
  selector: 'app-receive-batch-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './receive-batch-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './receive-batch-form.css',
})
export class ReceiveBatchForm {
  /** Form owned by the view. */
  readonly form = input.required<ReceiveBatchFormGroup>();

  /** Unit of the received amount. */
  readonly unit = input.required<InventoryUnit>();

  /** Earliest date the form accepts. */
  readonly minDate = input.required<string>();

  /** Latest reception date. */
  readonly maxReceiptDate = input.required<string>();

  /** Latest expiration date. */
  readonly maxExpiryDate = input.required<string>();

  /** Whether a change is being saved. */
  readonly saving = input(false);

  /** The user asked to save the form. */
  readonly saveRequested = output<void>();

  /** The user closed the form without saving. */
  readonly cancelRequested = output<void>();

  /** Largest stock the platform accepts. */
  protected readonly maxStock = MAX_STOCK;
}
