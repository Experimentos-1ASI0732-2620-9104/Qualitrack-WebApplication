import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IamStore } from '../../../../iam/application/iam.store';
import { TranslatePipe } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { CreateLaboratoryCommand } from '../../../domain/model/create-laboratory.command';
import { DigitsOnly } from '../../../../shared/presentation/directives/digits-only.directive';
import { PhoneInput } from '../../../../shared/presentation/directives/phone-input.directive';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';
import {
  normalizePhone,
  phoneValidator,
} from '../../../../shared/presentation/validators/phone.validator';
import { rucValidator } from '../../../../shared/presentation/validators/ruc.validator';

/**
 * Component responsible for creating a new laboratory.
 *
 * @remarks
 * This presentation component captures laboratory registration data through a
 * reactive form and dispatches a create laboratory command to the Laboratory store.
 */
@Component({
  selector: 'app-lab-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    DigitsOnly,
    PhoneInput,
  ],
  templateUrl: './lab-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './lab-form.css',
})
export class LabForm {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Form builder used to create the laboratory registration form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Store that exposes the authenticated session and its onboarding state.
   */
  private readonly iam = inject(IamStore);

  /**
   * Available regulation options shown in the laboratory form.
   */
  protected readonly regulations = ['BPM_DIGEMID', 'ISO_9001', 'ISO_13485', 'GMP_WHO'];

  /**
   * Reactive form used to capture laboratory registration data.
   */
  protected readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, notBlankValidator, Validators.maxLength(100)]],
    ruc: ['', [Validators.required, rucValidator]],
    address: ['', [Validators.required, notBlankValidator, Validators.maxLength(250)]],
    phone: ['', [Validators.required, phoneValidator]],
    applicableRegulations: [[], Validators.required],
  });

  /**
   * Submits the laboratory form and dispatches a create laboratory command.
   *
   * @remarks
   * Once the laboratory is created, the onboarding state is refreshed and the user
   * continues the onboarding flow.
   */
  protected onSubmit(): void {
    if (this.form.invalid || this.store.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const command: CreateLaboratoryCommand = {
      ...value,
      name: value.name.trim(),
      ruc: value.ruc.trim(),
      address: value.address.trim(),
      phone: normalizePhone(value.phone) ?? value.phone,
    };
    this.store.createLaboratory(command, () => {
      this.iam.invalidateOnboarding();
      void this.router.navigate(['/iam/onboarding']);
    });
  }

  /**
   * Cancels laboratory registration and signs the user out.
   */
  protected onCancel(): void {
    this.iam.signOut(this.router);
  }
}
