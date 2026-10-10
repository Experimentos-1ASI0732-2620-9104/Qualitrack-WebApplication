import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { SignInCommand } from '../../../domain/model/sign-in.command';
import { IamStore } from '../../../application/iam.store';
import { Toolbar } from '../../../../shared/presentation/components/toolbar/toolbar';

/**
 * Component responsible for rendering and processing the sign-in form.
 *
 * @remarks
 * This standalone component belongs to the IAM presentation layer. It validates
 * user credentials through a reactive form, builds a SignInCommand, and delegates
 * authentication to IamStore.
 */
@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, MatProgressSpinnerModule, MatIconModule, RouterLink, Toolbar],
  templateUrl: './sign-in-form.html',
  styleUrls: ['./sign-in-form.css'],
})
export class SignInForm {
  /**
   * Store responsible for authentication state and operations.
   */
  protected readonly store = inject(IamStore);

  /**
   * Router used to navigate after authentication.
   */
  private readonly router = inject(Router);

  /**
   * Reactive form used to capture sign-in credentials.
   */
  protected readonly form = new FormGroup({
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  /**
   * Indicates whether the password input should be visually hidden.
   */
  protected hidePassword = true;

  /** Set when the person arrives after resetting the password with a recovery code. */
  protected readonly passwordReset: boolean;

  /**
   * Creates the form.
   *
   * @remarks
   * If the person comes from the password recovery, the navigation state carries `passwordReset` (to show a notice)
   * and the username, which is filled in.
   */
  constructor() {
    const state = this.router.currentNavigation()?.extras.state as { passwordReset?: boolean; username?: string } | undefined;
    this.passwordReset = !!state?.passwordReset;
    if (state?.username) this.form.controls.username.setValue(state.username);
  }

  /**
   * Submits the sign-in form.
   */
  protected onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    const command: SignInCommand = {
      username: this.form.controls.username.value,
      password: this.form.controls.password.value,
    };

    this.store.signIn(command, this.router);
  }

  /**
   * Toggles password visibility in the form.
   */
  protected togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Resolves the translation key for username validation errors.
   *
   * @returns Translation key for the current username validation error
   */
  protected getUsernameErrorKey(): string {
    const control = this.form.controls.username;

    if (control.hasError('required')) return 'iam.sign-in.errors.username-required';
    if (control.hasError('minlength')) return 'iam.sign-in.errors.username-minlength';

    return '';
  }

  /**
   * Resolves the translation key for password validation errors.
   *
   * @returns Translation key for the current password validation error
   */
  protected getPasswordErrorKey(): string {
    const control = this.form.controls.password;

    if (control.hasError('required')) return 'iam.sign-in.errors.password-required';
    if (control.hasError('minlength')) return 'iam.sign-in.errors.password-minlength';

    return '';
  }

  /**
   * Marks every control inside a form group as touched.
   *
   * @param formGroup - Form group to update
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}
