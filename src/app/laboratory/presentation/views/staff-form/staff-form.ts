import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { RegisterStaffCommand } from '../../../domain/model/register-staff.command';

/**
 * Component responsible for registering laboratory staff members.
 *
 * @remarks
 * This presentation component captures staff profile data through a reactive
 * form and dispatches a register staff command to the Laboratory store.
 */
@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './staff-form.html',
  styleUrl: './staff-form.css',
})
export class StaffForm {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Form builder used to create the staff registration form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Available staff roles selectable in the form.
   */
  protected readonly roles = ['QA_MANAGER', 'LAB_OPERATOR', 'AUDITOR'];

  /**
   * Reactive form used to capture staff registration data.
   */
  protected readonly form: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    role: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  /**
   * Retrieves the current laboratory ID from the authenticated context.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Submits the staff form and dispatches a register staff command.
   */
  protected onSubmit(): void {
    if (this.form.invalid) return;

    const command: RegisterStaffCommand = {
      laboratoryId: this.currentLaboratoryId,
      ...this.form.getRawValue(),
    };

    this.store.registerStaff(this.currentLaboratoryId, command);
    this.router.navigate(['/laboratories/staff-list']);
  }

  /**
   * Cancels staff registration and returns to the staff list.
   */
  protected onCancel(): void {
    this.router.navigate(['/laboratories/staff-list']);
  }
}
