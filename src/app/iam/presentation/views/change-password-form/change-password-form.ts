import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IamStore } from '../../../application/iam.store';
import { Toolbar } from '../../../../shared/presentation/components/toolbar/toolbar';

/** Password fields of the form whose visibility can be toggled. */
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

/**
 * Asks a staff member to replace the temporary password received when their quality manager
 * registered them before using the platform.
 *
 * @remarks
 * It is the first onboarding step (`/iam/change-password`). The new password needs 8 to 72 characters with letters
 * and digits, must match the confirmation and differ from the current one. Once changed, the user goes back to
 * `/iam/onboarding`, which resolves the next step.
 */
@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule, MatProgressSpinnerModule, Toolbar],
  templateUrl: './change-password-form.html',
  styleUrls: ['../sign-in-form/sign-in-form.css'],
})
export class ChangePasswordForm {
  /** Session store that changes the password. */
  protected readonly store = inject(IamStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether the new password is being saved. */
  protected readonly saving = signal(false);
  /** Translation key of the latest error, or null. */
  protected readonly error = signal<string | null>(null);
  /** Whether each password field hides its value. */
  protected readonly hidden = signal<Record<PasswordField, boolean>>({
    currentPassword: true,
    newPassword: true,
    confirmPassword: true,
  });

  /** Form with the current password, the new password and its confirmation. */
  protected readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)],
      }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [ChangePasswordForm.matches, ChangePasswordForm.differs] },
  );

  /**
   * Shows or hides the value of a password field.
   *
   * @param field - Field to toggle
   */
  protected toggle(field: PasswordField): void {
    this.hidden.update((value) => ({ ...value, [field]: !value[field] }));
  }

  /**
   * Resolves the error message of the new password.
   *
   * @returns Translation key of the first broken rule, or an empty string if it is valid
   */
  protected newPasswordError(): string {
    const control = this.form.controls.newPassword;
    if (control.hasError('required')) return 'iam.change-password.errors.required';
    if (control.hasError('minlength') || control.hasError('maxlength')) return 'iam.change-password.errors.length';
    if (control.hasError('pattern')) return 'iam.change-password.errors.strength';
    if (this.form.hasError('samePassword')) return 'iam.change-password.errors.same-password';
    return '';
  }

  /**
   * Changes the password if the form is valid. A 400 answer means the current password is wrong.
   */
  protected submit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.store.changePassword(currentPassword, newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl('/iam/onboarding', { replaceUrl: true }),
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(error.status === 400
            ? 'iam.change-password.errors.current-password'
            : 'iam.change-password.errors.unavailable');
        },
      });
  }

  /** Ends the session without changing the password. */
  protected signOut(): void {
    this.store.signOut(this.router);
  }

  /**
   * Group validator: the confirmation must match the new password.
   *
   * @param group - Form group of the passwords
   * @returns `{ passwordMismatch: true }` if they differ, null otherwise
   */
  private static matches(group: AbstractControl): ValidationErrors | null {
    return group.get('newPassword')?.value === group.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }

  /**
   * Group validator: the new password must differ from the current one.
   *
   * @param group - Form group of the passwords
   * @returns `{ samePassword: true }` if they are equal, null otherwise
   */
  private static differs(group: AbstractControl): ValidationErrors | null {
    const value = group.get('newPassword')?.value;
    return value && value === group.get('currentPassword')?.value ? { samePassword: true } : null;
  }
}
