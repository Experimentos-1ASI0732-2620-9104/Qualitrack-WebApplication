import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { StorageContainer } from '../../../domain/model/storage-container.entity';

/** Controls of the form that stores a reception in a container. */
export type ContainerAssignmentFormGroup = FormGroup<{
  containerMonitorId: FormControl<number | null>;
}>;

/**
 * Form that stores a reception in a monitored container.
 *
 * @remarks
 * Without containers available it explains it and links to the equipment, where they are registered.
 */
@Component({
  selector: 'app-container-assignment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './container-assignment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './container-assignment-form.css',
})
export class ContainerAssignmentForm {
  /** Reception to store. */
  readonly receipt = input.required<RawMaterialBatch>();

  /** Form owned by the view. */
  readonly form = input.required<ContainerAssignmentFormGroup>();

  /** Containers the reception can be stored in. */
  readonly containers = input.required<readonly StorageContainer[]>();

  /** Whether a change is being saved. */
  readonly saving = input(false);

  /** The user confirmed the container. */
  readonly confirmRequested = output<void>();

  /** The user closed the form without storing the reception. */
  readonly cancelRequested = output<void>();
}
