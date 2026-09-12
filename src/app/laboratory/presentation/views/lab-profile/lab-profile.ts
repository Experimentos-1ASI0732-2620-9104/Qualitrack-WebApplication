import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { UpdateLaboratoryCommand } from '../../../domain/model/update-laboratory.command';

/**
 * Component responsible for displaying and editing the current laboratory profile.
 *
 * @remarks
 * This presentation component loads the laboratory profile associated with the
 * authenticated context and provides a reactive form for updating mutable
 * laboratory data such as name, address, phone, and applicable regulations.
 */
@Component({
  selector: 'app-lab-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './lab-profile.html',
  styleUrl: './lab-profile.css',
})
export class LabProfile implements OnInit {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Form builder used to create the laboratory profile form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Signal indicating whether the profile form is currently in edit mode.
   */
  protected readonly isEditing = signal<boolean>(false);

  /**
   * Available regulation options shown in the profile form.
   */
  protected readonly regulations = ['BPM_DIGEMID', 'ISO_9001', 'ISO_13485', 'GMP_WHO'];

  /**
   * Reactive form used to update mutable laboratory profile data.
   */
  protected readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    address: ['', Validators.required],
    phone: ['', Validators.required],
    applicableRegulations: [[], Validators.required],
  });

  /**
   * Retrieves the current laboratory ID from the authenticated context.
   *
   * @remarks
   * Defaults to 1 when no context is available, matching the development flow
   * used across the current frontend bounded contexts.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Lifecycle hook that loads the current laboratory profile.
   */
  ngOnInit(): void {
    this.store.loadLaboratory(this.currentLaboratoryId);
  }

  /**
   * Enables edit mode and hydrates the form with the current laboratory profile.
   */
  protected onEdit(): void {
    const laboratory = this.store.laboratory();
    if (!laboratory) return;

    this.form.patchValue({
      name: laboratory.name,
      address: laboratory.address,
      phone: laboratory.phone,
      applicableRegulations: laboratory.applicableRegulations,
    });

    this.isEditing.set(true);
  }

  /**
   * Submits the current form value as an update laboratory command.
   */
  protected onSave(): void {
    if (this.form.invalid) return;

    const command: UpdateLaboratoryCommand = this.form.getRawValue();
    this.store.updateLaboratory(this.currentLaboratoryId, command);
    this.isEditing.set(false);
  }

  /**
   * Cancels edit mode and clears current store messages.
   */
  protected onCancel(): void {
    this.isEditing.set(false);
    this.store.clearMessages();
  }
}
