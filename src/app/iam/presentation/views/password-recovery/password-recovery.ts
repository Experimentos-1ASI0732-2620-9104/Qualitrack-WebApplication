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
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IamStore } from '../../../application/iam.store';
import { Toolbar } from '../../../../shared/presentation/components/toolbar/toolbar';

/** Password fields of the reset form whose visibility can be toggled. */
type PasswordField = 'newPassword' | 'confirmPassword';

/**
 * Password recovery (US16, US17): the person gives the username or e-mail of the account, receives a 6-digit code by
 * e-mail and sets a new password with it.
 *
 * @remarks
 * Two steps in the same view: `request` (account form) and `reset` (code, new password and confirmation). After the
 * reset the person goes to `/iam/sign-in` with the username filled in.
 */
@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule, MatProgressSpinnerModule, RouterLink, Toolbar],
  templateUrl: './password-recovery.html',
  styleUrls: ['../sign-in-form/sign-in-form.css'],
})
export class PasswordRecovery {
  /** Session store that sends the code and resets the password. */
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Step of the recovery: ask for the account, then enter the code and the new password. */
  protected readonly step = signal<'request' | 'reset'>('request');
  /** Whether a request is running. */
  protected readonly sending = signal(false);
  /** Translation key of the latest error, or null. */
  protected readonly error = signal<string | null>(null);
  /** Translation key of an informative notice (e.g. the code was sent again), or null. */
  protected readonly notice = signal<string | null>(null);
  /** Minutes during which the code can be used, as the platform answered. */
  protected readonly validityMinutes = signal(15);
  /** Whether each password field hides its value. */
  protected readonly hidden = signal<Record<PasswordField, boolean>>({ newPassword: true, confirmPassword: true });

  /** Form of the first step: username or e-mail of the account. */
  protected readonly accountForm = new FormGroup({
    account: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
  });

  /** Form of the second step: 6-digit code, new password (8 to 72, letters and digits) and confirmation. */
  protected readonly resetForm = new FormGroup(
    {
      code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)],
      }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: PasswordRecovery.matches },
  );

  /**
   * Shows or hides the value of a password field.
   *
   * @param field - Field to toggle
   */
  protected toggle(field: PasswordField): void {
    this.hidden.update((value) => ({ ...value, [field]: !value[field] }));
  }

  /** Sends the code to the e-mail of the account; also used to send a new one. */
  protected requestCode(): void {
    this.error.set(null);
    this.notice.set(null);
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.store.requestPasswordRecovery(this.accountForm.controls.account.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (minutes) => {
          this.sending.set(false);
          this.validityMinutes.set(minutes);
          if (this.step() === 'reset') this.notice.set('iam.password-recovery.code-resent');
          this.step.set('reset');
        },
        error: (error: HttpErrorResponse) => {
          this.sending.set(false);
          this.error.set(error.status === 0 ? 'onboarding.connection-error' : 'iam.password-recovery.errors.request');
        },
      });
  }

  /**
   * Sets the new password with the code. A 400 answer means the code is wrong or expired.
   */
  protected resetPassword(): void {
    this.error.set(null);
    this.notice.set(null);
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const { code, newPassword } = this.resetForm.getRawValue();
    this.sending.set(true);
    this.store.resetPassword({ account: this.accountForm.controls.account.value, code, newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (username) => void this.router.navigate(['/iam/sign-in'], {
          replaceUrl: true, state: { passwordReset: true, username },
        }),
        error: (error: HttpErrorResponse) => {
          this.sending.set(false);
          this.error.set(error.status === 400 ? 'iam.password-recovery.errors.invalid-code'
            : error.status === 0 ? 'onboarding.connection-error' : 'iam.password-recovery.errors.reset');
        },
      });
  }

  /** Goes back to change the account. */
  protected changeAccount(): void {
    this.error.set(null);
    this.notice.set(null);
    this.resetForm.reset();
    this.step.set('request');
  }

  /**
   * Resolves the error message of the code.
   *
   * @returns Translation key of the broken rule
   */
  protected codeError(): string {
    const control = this.resetForm.controls.code;
    return control.hasError('required') ? 'iam.change-password.errors.required' : 'iam.password-recovery.errors.code-format';
  }

  /**
   * Resolves the error message of the new password.
   *
   * @returns Translation key of the first broken rule
   */
  protected newPasswordError(): string {
    const control = this.resetForm.controls.newPassword;
    if (control.hasError('required')) return 'iam.change-password.errors.required';
    if (control.hasError('minlength') || control.hasError('maxlength')) return 'iam.change-password.errors.length';
    return 'iam.change-password.errors.strength';
  }

  /**
   * Group validator: the confirmation must match the new password.
   *
   * @param group - Form group of the reset step
   * @returns `{ passwordMismatch: true }` if they differ, null otherwise
   */
  private static matches(group: AbstractControl): ValidationErrors | null {
    return group.get('newPassword')?.value === group.get('confirmPassword')?.value ? null : { passwordMismatch: true };
  }
}
