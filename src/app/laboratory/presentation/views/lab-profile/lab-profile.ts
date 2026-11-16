import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

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
import { PhoneInput } from '../../../../shared/presentation/directives/phone-input.directive';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';
import {
  normalizePhone,
  phoneValidator,
} from '../../../../shared/presentation/validators/phone.validator';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { LABORATORY_TABS } from '../../laboratory-tabs';

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
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    PageHeader,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PhoneInput,
  ],
  templateUrl: './lab-profile.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
    name: ['', [Validators.required, notBlankValidator, Validators.maxLength(100)]],
    address: ['', [Validators.required, notBlankValidator, Validators.maxLength(250)]],
    phone: ['', [Validators.required, phoneValidator]],
    applicableRegulations: [[], Validators.required],
  });

  /**
   * Retrieves the current laboratory ID from the authenticated context.
   *
   * @throws Error when the user has not set up a laboratory yet
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

  /** Operations of the laboratory module. */
  protected readonly tabs = LABORATORY_TABS;

  /** Reads the laboratory profile again. */
  protected reload(): void {
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
    if (this.form.invalid) {
      // Saving with something wrong points at the fields to fix, like every form of the app
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const command: UpdateLaboratoryCommand = {
      ...value,
      name: value.name.trim(),
      address: value.address.trim(),
      phone: normalizePhone(value.phone) ?? value.phone,
    };
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
