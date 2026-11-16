import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MAX_PHOTO_BYTES, PHOTO_TYPES, ProfileStore, errorStatus } from '../../../application/profile.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { DigitsOnly } from '../../../../shared/presentation/directives/digits-only.directive';
import { PhoneInput } from '../../../../shared/presentation/directives/phone-input.directive';
import { dniValidator } from '../../../../shared/presentation/validators/dni.validator';
import { emailValidator } from '../../../../shared/presentation/validators/email.validator';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';
import {
  normalizePhone,
  phoneValidator,
} from '../../../../shared/presentation/validators/phone.validator';
import { personNameValidator } from '../../../../shared/presentation/validators/person-name.validator';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';

/**
 * Letters and digits, as the password policy of the platform requires.
 *
 * @param control - Control of the new password; an empty value is left to `Validators.required`
 * @returns `{ strength: true }` if the value lacks a letter or a digit, null otherwise
 */
function lettersAndDigits(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  return !value || (/[A-Za-z]/.test(value) && /\d/.test(value)) ? null : { strength: true };
}

/**
 * Profile of the signed-in user: photo, personal data, account (username and e-mail), password and notification
 * preferences. It opens from the name in the toolbar.
 *
 * @remarks
 * Each section has its own form, saving flag and message, so saving one does not block the others. The personal data
 * and photo go through the {@link ProfileStore}; the account and password through the {@link IamStore}. A URL fragment
 * scrolls to its section; the legacy `/profile#notifications` link opens the CA preferences page.
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    DateTimePipe,
    ReactiveFormsModule,
    TranslatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
    DigitsOnly,
    PhoneInput,
  ],
  templateUrl: './profile-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile-page.css',
})
export class ProfilePage implements AfterViewInit {
  /** Store of the profile and photo of the signed-in user. */
  protected readonly store = inject(ProfileStore);
  /** Session store; updates the account and the password. */
  protected readonly iam = inject(IamStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  /** Hidden file input opened by the "change photo" button. */
  private readonly photoInput = viewChild<ElementRef<HTMLInputElement>>('photoInput');

  /** MIME types accepted by the file input. */
  protected readonly photoTypes = PHOTO_TYPES.join(',');
  /** Whether the photo is being uploaded or removed. */
  protected readonly photoBusy = signal(false);
  /** Translation key of the latest photo error. */
  protected readonly photoError = signal<string | null>(null);
  /** Whether the personal data is being saved. */
  protected readonly personalSaving = signal(false);
  /** Result of the latest save of the personal data, as a translation key. */
  protected readonly personalMessage = signal<{ ok: boolean; key: string } | null>(null);
  /** Whether the account (username and e-mail) is being saved. */
  protected readonly accountSaving = signal(false);
  /** Result of the latest save of the account, as a translation key. */
  protected readonly accountMessage = signal<{ ok: boolean; key: string } | null>(null);
  /** Whether the password is being changed. */
  protected readonly passwordSaving = signal(false);
  /** Result of the latest password change, as a translation key. */
  protected readonly passwordMessage = signal<{ ok: boolean; key: string } | null>(null);

  /** Translation keys of the roles of the signed-in user. */
  protected readonly roleKeys = computed(() =>
    (this.store.profile()?.roles ?? this.iam.currentRoles()).map((role) => `profile.roles.${role}`),
  );

  /** Form of the personal data: full name, DNI (8 digits), phone number and location. */
  protected readonly personalForm = this.fb.nonNullable.group({
    fullName: [
      '',
      [
        Validators.required,
        notBlankValidator,
        personNameValidator,
        Validators.minLength(2),
        Validators.maxLength(120),
      ],
    ],
    dni: ['', [dniValidator]],
    phoneNumber: ['', [phoneValidator]],
    location: ['', [notBlankValidator, Validators.minLength(2), Validators.maxLength(120)]],
  });

  /** Form of the account: username and e-mail, confirmed with the current password. */
  protected readonly accountForm = this.fb.nonNullable.group({
    username: [
      '',
      [Validators.required, notBlankValidator, Validators.minLength(3), Validators.maxLength(80)],
    ],
    email: ['', [Validators.required, emailValidator, Validators.maxLength(120)]],
    currentPassword: ['', Validators.required],
  });

  /** Form of the password change: current password, new password (8 to 72, letters and digits) and confirmation. */
  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(72), lettersAndDigits],
    ],
    confirmPassword: ['', Validators.required],
  });

  /**
   * Loads the profile and fills the forms with it.
   *
   * @remarks
   * A form the user is editing (dirty) is not overwritten when the profile changes.
   */
  constructor() {
    this.store.load();
    effect(() => {
      const profile = this.store.profile();
      if (!profile) return;
      if (!this.personalForm.dirty) {
        this.personalForm.reset({
          fullName: profile.fullName ?? '',
          dni: profile.dni ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          location: profile.location ?? '',
        });
      }
      if (!this.accountForm.dirty) {
        this.accountForm.reset({
          username: profile.username,
          email: profile.email ?? '',
          currentPassword: '',
        });
      }
    });
  }

  /** Redirects the legacy notifications fragment; scrolls to other named profile sections. */
  ngAfterViewInit(): void {
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (!fragment) return;
      if (fragment === 'notifications') {
        void this.router.navigate(['/alerts/notification-settings'], { replaceUrl: true });
        return;
      }
      setTimeout(() =>
        this.host.nativeElement
          .querySelector(`#${CSS.escape(fragment)}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    });
  }

  /** Opens the file picker of the photo. */
  protected choosePhoto(): void {
    this.photoInput()?.nativeElement.click();
  }

  /**
   * Validates the chosen image (type and size) and uploads it as the new photo.
   *
   * @param event - Change event of the file input
   */
  protected photoChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0];
    input.value = '';
    if (!image) return;
    this.photoError.set(null);
    if (!PHOTO_TYPES.includes(image.type)) {
      this.photoError.set('profile.photo.errors.type');
      return;
    }
    if (image.size > MAX_PHOTO_BYTES) {
      this.photoError.set('profile.photo.errors.size');
      return;
    }
    this.photoBusy.set(true);
    this.store
      .replacePhoto(image)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.photoBusy.set(false),
        error: (error) => {
          this.photoBusy.set(false);
          this.photoError.set(
            errorStatus(error) === 413
              ? 'profile.photo.errors.size'
              : errorStatus(error) === 400 || errorStatus(error) === 415
                ? 'profile.photo.errors.type'
                : 'profile.photo.errors.failed',
          );
        },
      });
  }

  /** Removes the photo after the user confirms it. */
  protected removePhoto(): void {
    if (!confirm(this.translate.instant('profile.photo.remove-confirm'))) return;
    this.photoBusy.set(true);
    this.photoError.set(null);
    this.store
      .removePhoto()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.photoBusy.set(false),
        error: () => {
          this.photoBusy.set(false);
          this.photoError.set('profile.photo.errors.failed');
        },
      });
  }

  /** Saves the personal data if the form is valid. */
  protected savePersonalData(): void {
    this.personalForm.markAllAsTouched();
    if (this.personalForm.invalid || this.personalSaving()) return;
    this.personalSaving.set(true);
    this.personalMessage.set(null);
    const personal = this.personalForm.getRawValue();
    this.store
      .update({
        ...personal,
        phoneNumber: normalizePhone(personal.phoneNumber) ?? personal.phoneNumber,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.personalSaving.set(false);
          this.personalForm.markAsPristine();
          this.personalMessage.set({ ok: true, key: 'profile.personal.saved' });
        },
        error: (error) => {
          this.personalSaving.set(false);
          this.personalMessage.set({
            ok: false,
            key:
              errorStatus(error) === 400 ? 'profile.personal.errors.invalid' : 'profile.errors.failed',
          });
        },
      });
  }

  /**
   * Saves the username and e-mail if the form is valid, then reloads the profile.
   *
   * @remarks
   * A 409 answer means the username or e-mail is already taken.
   */
  protected saveAccount(): void {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid || this.accountSaving()) return;
    this.accountSaving.set(true);
    this.accountMessage.set(null);
    this.iam
      .updateAccount(this.accountForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.accountSaving.set(false);
          this.accountForm.markAsPristine();
          this.accountForm.controls.currentPassword.reset('');
          this.accountMessage.set({ ok: true, key: 'profile.account.saved' });
          this.store.load();
        },
        error: (error) => {
          this.accountSaving.set(false);
          const status = errorStatus(error);
          this.accountMessage.set({
            ok: false,
            key:
              status === 409
                ? 'profile.account.errors.taken'
                : status === 400
                  ? 'profile.account.errors.invalid'
                  : 'profile.errors.failed',
          });
        },
      });
  }

  /**
   * Changes the password if the form is valid, the confirmation matches and the new password differs from the
   * current one.
   */
  protected changePassword(): void {
    this.passwordForm.markAllAsTouched();
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid || this.passwordSaving()) return;
    if (newPassword !== confirmPassword) {
      this.passwordMessage.set({ ok: false, key: 'iam.change-password.errors.mismatch' });
      return;
    }
    if (newPassword === currentPassword) {
      this.passwordMessage.set({ ok: false, key: 'iam.change-password.errors.same-password' });
      return;
    }
    this.passwordSaving.set(true);
    this.passwordMessage.set(null);
    this.iam
      .changePassword(currentPassword, newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.passwordSaving.set(false);
          this.passwordForm.reset();
          this.passwordMessage.set({ ok: true, key: 'profile.password.saved' });
        },
        error: (error) => {
          this.passwordSaving.set(false);
          this.passwordMessage.set({
            ok: false,
            key:
              errorStatus(error) === 400
                ? 'iam.change-password.errors.current-password'
                : 'iam.change-password.errors.unavailable',
          });
        },
      });
  }
}
