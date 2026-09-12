import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { RegisterEquipmentCommand } from '../../../domain/model/register-equipment.command';

/**
 * Component responsible for displaying and handling the equipment registration form.
 *
 * @remarks
 * This standalone Angular component allows the user to register new equipment
 * associated with the current laboratory or authenticated user context.
 *
 * It uses Angular Reactive Forms to manage form data and validations, Material
 * components to build the user interface, and EquipmentStore to send the
 * registration command to the application layer.
 *
 * The component also obtains the laboratory identifier from IamStore, which is
 * used as the laboratoryId when creating the RegisterEquipmentCommand.
 *
 * @example
 * ```html
 * <app-equipment-form></app-equipment-form>
 * ```
 */
@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './equipment-form.html',
  styleUrl: './equipment-form.css',
})
export class EquipmentForm {
  /**
   * FormBuilder instance used to create and configure the reactive form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to navigate after successful form submission.
   */
  private readonly router = inject(Router);

  /**
   * Store responsible for equipment-related state and operations.
   */
  protected readonly store = inject(EquipmentStore);

  /**
   * Store responsible for identity and access management state.
   */
  private readonly iamStore = inject(IamStore);

  /**
   * List of available equipment types displayed in the form.
   */
  protected readonly equipmentTypes = [
    'Autoclave',
    'Centrifuge',
    'Incubator',
    'Mixer',
    'Refrigerator',
    'HPLC System',
    'IoT Sensor',
  ];

  /**
   * Reactive form used to register equipment.
   *
   * @remarks
   * The form contains fields for equipment name, type, model, and serial number.
   * Validators ensure that required data is provided, the name has a minimum
   * length, and the serial number only contains letters, numbers, and hyphens.
   */
  protected form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    type: ['', Validators.required],
    model: ['', Validators.required],
    serialNumber: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
  });

  /**
   * Gets the current laboratory identifier from the authenticated user context.
   *
   * @returns The current laboratory numeric identifier.
   *
   * @remarks
   * The application currently uses the authenticated user ID as the laboratory
   * context. If no user ID is available, it falls back to 1 to keep local
   * development and seeded demo scenarios usable.
   */
  private get currentLabId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Saves the equipment registration form.
   *
   * @remarks
   * This method first validates the form. Then it creates a
   * RegisterEquipmentCommand using the current laboratory context and sends it
   * to EquipmentStore.
   *
   * After dispatching the command, the user is redirected to the equipment list.
   */
  protected onSave(): void {
    if (this.form.invalid) return;

    const command: RegisterEquipmentCommand = {
      laboratoryId: this.currentLabId,
      ...this.form.getRawValue(),
    };

    this.store.registerEquipment(command);
    this.router.navigate(['/equipments/equipment-list']).then();
  }
}
