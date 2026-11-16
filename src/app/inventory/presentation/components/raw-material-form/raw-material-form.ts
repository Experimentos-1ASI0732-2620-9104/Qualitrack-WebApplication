import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryUnit } from '../../../domain/model/raw-material.entity';
import { MAX_STOCK } from '../../../domain/model/stock-limits';

/** Controls of the form that edits a raw material. */
export type RawMaterialMetadataForm = FormGroup<{
  code: FormControl<string>;
  name: FormControl<string>;
  minimumStock: FormControl<number>;
}>;

/**
 * Form that edits the code, the name and the minimum stock of a raw material.
 *
 * @remarks
 * The view owns the form and saves it; this component only shows it and tells what the user asked for.
 */
@Component({
  selector: 'app-raw-material-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './raw-material-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './raw-material-form.css',
})
export class RawMaterialForm {
  /** Form owned by the view. */
  readonly form = input.required<RawMaterialMetadataForm>();

  /** Unit of the minimum stock. */
  readonly unit = input.required<InventoryUnit>();

  /** Whether a change is being saved. */
  readonly saving = input(false);

  /** The user asked to save the form. */
  readonly saveRequested = output<void>();

  /** The user closed the form without saving. */
  readonly cancelRequested = output<void>();

  /** Largest stock the platform accepts. */
  protected readonly maxStock = MAX_STOCK;
}
