import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { IamStore } from '../../../application/iam.store';
import { SignUpCommand } from '../../../domain/model/sign-up.command';
import { Toolbar } from '../../../../shared/presentation/components/toolbar/toolbar';

/**
 * Component responsible for rendering and processing the sign-up form.
 *
 * @remarks
 * This standalone component belongs to the IAM presentation layer. It validates
 * account registration data through a reactive form, resolves the selected role
 * from route query parameters, builds a SignUpCommand, and delegates
 * registration to IamStore.
 */
@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterLink,
    Toolbar,
  ],
  templateUrl: './sign-up-form.html',
  styleUrls: ['./sign-up-form.css'],
})
export class SignUpForm {
  /**
   * Store responsible for authentication state and registration operations.
   */
  protected readonly store = inject(IamStore);

  /**
   * Router used to navigate after successful registration.
   */
  private readonly router = inject(Router);

  /**
   * Activated route used to read the desired registration role.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Current registration mode passed through the route.
   */
  protected role: string = 'lab-operator';

  /**
   * Backend role selected for the new account.
   */
  protected selectedRole: string = 'ROLE_LAB_OPERATOR';

  /**
   * Translation key suffix used to display the selected role.
   */
  protected selectedRoleKey: 'manager' | 'operator' = 'operator';

  /**
   * Temporary laboratory identifier used while the laboratory ownership flow is completed.
   */

  /**
   * Reactive form used to capture sign-up data.
   */
  protected readonly form = new FormGroup(
    {
      username: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6), this.passwordStrengthValidator],
      }),
      confirmPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: this.passwordMatchValidator },
  );

  /**
   * Indicates whether the password input should be visually hidden.
   */
  protected hidePassword = true;

  /**
   * Indicates whether the confirm-password input should be visually hidden.
   */
  protected hideConfirmPassword = true;

  /**
   * Creates the sign-up component and resolves the registration role from query params.
   */
  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['role'] === 'qa-manager') {
        this.role = 'qa-manager';
        this.selectedRole = 'ROLE_QA_MANAGER';
        this.selectedRoleKey = 'manager';
        return;
      }

      this.role = 'lab-operator';
      this.selectedRole = 'ROLE_LAB_OPERATOR';
      this.selectedRoleKey = 'operator';
    });
  }

  /**
   * Submits the sign-up form.
   */
  protected onSubmit(): void {
    this.store.clearError();

    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    const command: SignUpCommand = {
      username: this.form.controls.username.value,
      password: this.form.controls.password.value,
      roles: [this.selectedRole],
      laboratoryId: null,
    };

    this.store.signUp(command, this.router);
  }

  /**
   * Toggles password visibility in the form.
   */
  protected togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Toggles confirm-password visibility in the form.
   */
  protected toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  /**
   * Resolves the translation key for username validation errors.
   *
   * @returns Translation key for the current username validation error
   */
  protected getUsernameErrorKey(): string {
    const control = this.form.controls.username;

    if (control.hasError('required')) return 'iam.sign-up.errors.username-required';
    if (control.hasError('minlength')) return 'iam.sign-up.errors.username-minlength';

    return '';
  }

  /**
   * Resolves the translation key for password validation errors.
   *
   * @returns Translation key for the current password validation error
   */
  protected getPasswordErrorKey(): string {
    const control = this.form.controls.password;

    if (control.hasError('required')) return 'iam.sign-up.errors.password-required';
    if (control.hasError('minlength')) return 'iam.sign-up.errors.password-minlength';
    if (control.hasError('passwordStrength')) return 'iam.sign-up.errors.password-strength';

    return '';
  }

  /**
   * Resolves the translation key for confirm-password validation errors.
   *
   * @returns Translation key for the current confirm-password validation error
   */
  protected getConfirmPasswordErrorKey(): string {
    const control = this.form.controls.confirmPassword;

    if (control.hasError('required')) return 'iam.sign-up.errors.confirm-password-required';
    if (this.form.hasError('passwordMismatch')) return 'iam.sign-up.errors.password-mismatch';

    return '';
  }

  /**
   * Validates whether the password contains at least one letter and one number.
   *
   * @param control - Password form control
   * @returns Validation error object or null
   */
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) return null;

    const passwordValid = /[0-9]/.test(value) && /[a-zA-Z]/.test(value);
    return passwordValid ? null : { passwordStrength: true };
  }

  /**
   * Validates whether password and confirm-password fields match.
   *
   * @param group - Form group containing password fields
   * @returns Validation error object or null
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    return group.get('password')?.value === group.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  /**
   * Marks every control inside a form group as touched.
   *
   * @param formGroup - Form group to update
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => formGroup.get(key)?.markAsTouched());
  }
}
