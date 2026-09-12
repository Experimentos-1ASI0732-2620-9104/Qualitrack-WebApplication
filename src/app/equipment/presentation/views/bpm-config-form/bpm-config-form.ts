import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { ConfigureBpmCommand } from '../../../domain/model/configure-bpm.command';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Component responsible for displaying and handling the BPM configuration form.
 *
 * @remarks
 * This standalone Angular component allows the user to configure a BPM parameter
 * for a specific equipment. It obtains the equipment identifier from the route,
 * manages the form using Angular Reactive Forms, validates the entered data,
 * and sends the configuration command to the EquipmentStore.
 *
 * The component belongs to the equipment management feature and interacts with
 * the application layer through EquipmentStore instead of calling the API
 * directly.
 *
 * @example
 * ```html
 * <app-bpm-config-form></app-bpm-config-form>
 * ```
 */
@Component({
  selector: 'app-bpm-config-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './bpm-config-form.html',
  styleUrl: './bpm-config-form.css',
})
export class BpmConfigForm implements OnInit {
  /**
   * FormBuilder instance used to create and manage the reactive form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * ActivatedRoute instance used to access route parameters.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Router used to navigate after configuring BPM parameters.
   */
  private readonly router = inject(Router);

  /**
   * Store responsible for equipment-related state and operations.
   */
  protected readonly store = inject(EquipmentStore);

  /**
   * Signal that stores the current numeric equipment identifier.
   *
   * @remarks
   * The value is obtained from the route parameter named id during component
   * initialization. It remains null if no equipment identifier is available.
   */
  protected readonly equipmentId = signal<number | null>(null);

  /**
   * Reactive form used to configure a BPM parameter.
   *
   * @remarks
   * The form contains the parameter name, minimum value, maximum value,
   * and measurement unit. Numeric fields use a pattern validator to allow
   * integer or decimal values, including negative values when needed.
   */
  protected form: FormGroup = this.fb.group({
    parameterName: ['', [Validators.required]],
    minValue: [null, [Validators.required, Validators.pattern(/^-?\d*\.?\d+$/)]],
    maxValue: [null, [Validators.required, Validators.pattern(/^-?\d*\.?\d+$/)]],
    unit: ['', [Validators.required]],
  });

  /**
   * Initializes the component and retrieves the equipment identifier from the route.
   *
   * @remarks
   * If the route contains an id parameter, it is stored in the equipmentId signal
   * so it can later be used when building the BPM configuration command.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.equipmentId.set(Number(idParam));
    }
  }

  /**
   * Saves the BPM parameter configuration.
   *
   * @remarks
   * This method validates the form and verifies that an equipment identifier
   * exists before creating the ConfigureBpmCommand.
   *
   * Numeric values are explicitly converted to number because form controls can
   * return strings depending on browser/input behavior.
   *
   * After dispatching the command, the user is redirected to the equipment
   * detail view.
   */
  protected onSave(): void {
    const equipmentId = this.equipmentId();

    if (this.form.invalid || !equipmentId) return;

    const formValue = this.form.getRawValue();

    const command: ConfigureBpmCommand = {
      equipmentId,
      parameterName: formValue.parameterName,
      minValue: Number(formValue.minValue),
      maxValue: Number(formValue.maxValue),
      unit: formValue.unit,
    };

    this.store.configureBpm(command);
    this.router.navigate(['/equipments/equipment-detail', equipmentId]).then();
  }
}
