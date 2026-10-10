import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { RegisteredStaff } from '../../../domain/model/register-staff.command';
import { StaffAccessRole } from '../../../domain/model/staff-member.entity';
import { ApiError } from '../../../../shared/infrastructure/api-error';

/**
 * Form with which a quality manager registers an operator or an auditor of the laboratory.
 *
 * @remarks
 * The platform creates the account of the staff member with the e-mail as username and sends the
 * credentials by e-mail. When they cannot be e-mailed, the temporary password is shown here once so
 * the quality manager hands it over; the staff member changes it at the first sign in.
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
    MatRadioModule,
    MatTooltipModule,
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
   * Store that exposes the laboratory of the authenticated session.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Clipboard used to copy the credentials.
   */
  private readonly clipboard = inject(Clipboard);

  /**
   * Reference used to stop the registration request when the view is destroyed.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Access roles the quality manager can give.
   */
  protected readonly accessRoles: StaffAccessRole[] = ['OPERATOR', 'AUDITOR'];

  /**
   * Staff member just registered with the delivery of their credentials, or `null` before registering.
   */
  protected readonly registered = signal<RegisteredStaff | null>(null);

  /**
   * Translation key of the latest error, if any.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Credential field last copied to the clipboard, if any.
   */
  protected readonly copied = signal<'username' | 'password' | null>(null);

  /**
   * Reactive form used to capture the staff member data.
   */
  protected readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    role: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(150)],
    }),
    accessRole: new FormControl<StaffAccessRole>('OPERATOR', { nonNullable: true, validators: [Validators.required] }),
  });

  /**
   * Registers the staff member and shows the delivery of their credentials.
   */
  protected onSubmit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.store.registerStaff(this.iamStore.requireLaboratoryId(), {
      fullName: value.fullName.trim(),
      role: value.role.trim(),
      email: value.email.trim(),
      accessRole: value.accessRole,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (registered) => this.registered.set(registered),
      error: (error: unknown) => this.error.set(this.errorKey(error)),
    });
  }

  /**
   * Copies a credential to the clipboard.
   *
   * @param field - Credential field being copied
   * @param value - Value to copy; nothing is copied when it is `null`
   */
  protected copy(field: 'username' | 'password', value: string | null): void {
    if (value && this.clipboard.copy(value)) this.copied.set(field);
  }

  /**
   * Clears the result and the form to register another staff member.
   */
  protected registerAnother(): void {
    this.registered.set(null);
    this.copied.set(null);
    this.form.reset({ fullName: '', role: '', email: '', accessRole: 'OPERATOR' });
  }

  /**
   * Returns to the staff list.
   */
  protected onCancel(): void {
    void this.router.navigate(['/laboratories/staff-list']);
  }

  /**
   * Converts a registration error into a translation key.
   *
   * @param error - Error emitted by the registration request
   * @returns Translation key that explains the error to the quality manager
   */
  private errorKey(error: unknown): string {
    const status = error instanceof ApiError ? error.status : 0;
    if (status === 409) return 'staff-form.errors.email-taken';
    if (status === 400) return 'staff-form.errors.invalid';
    if (status === 403) return 'staff-form.errors.forbidden';
    return 'staff-form.errors.unavailable';
  }
}
