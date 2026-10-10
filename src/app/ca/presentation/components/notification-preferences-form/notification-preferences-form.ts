import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { CaStore, alertError } from '../../../application/ca.store';
import { AlertSeverity } from '../../../domain/model/deviation-alert.entity';

/**
 * Notification preferences of the signed-in user, shown in the profile: whether notices reach the bell and the
 * e-mail, and from which alert severity (US83, US84).
 */
@Component({
  selector: 'app-notification-preferences-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './notification-preferences-form.html',
  styleUrl: './notification-preferences-form.css',
})
export class NotificationPreferencesForm implements OnInit {
  /** Store that holds the preferences of the signed-in user. */
  protected readonly store = inject(CaStore);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether the preferences are being saved. */
  protected readonly saving = signal(false);
  /** Whether the latest save succeeded and the form was not edited since. */
  protected readonly saved = signal(false);
  /** Translation key or server detail of the latest failed save. */
  protected readonly error = signal<string | null>(null);

  /**
   * Form of the preferences.
   *
   * @remarks
   * The minimum severity is limited to `WARNING` or `CRITICAL`.
   */
  protected readonly form = this.fb.nonNullable.group({
    inAppEnabled: [true],
    emailEnabled: [true],
    // Alerts are WARNING or CRITICAL; a stored LOW behaves as WARNING.
    minimumSeverity: ['WARNING' as AlertSeverity],
  });

  /**
   * Creates the form.
   *
   * @remarks
   * Whenever the store has preferences, the form is filled with them; a stored `LOW` is shown as `WARNING`.
   * Editing the form hides the confirmation of the latest save.
   */
  constructor() {
    effect(() => {
      const preference = this.store.preference();
      if (!preference) return;
      this.form.reset({
        inAppEnabled: preference.inAppEnabled,
        emailEnabled: preference.emailEnabled,
        minimumSeverity: preference.minimumSeverity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      }, { emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.saved.set(false));
  }

  /** Loads the preferences of the signed-in user. */
  ngOnInit(): void {
    this.store.loadNotificationPreferences();
  }

  /**
   * Saves the values of the form as the preferences of the user.
   *
   * @remarks
   * Does nothing while a save is in progress. On success the confirmation is shown and the form is marked as
   * pristine; on failure the error is kept in {@link NotificationPreferencesForm.error}.
   */
  protected save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.store.updateNotificationPreferences(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.set(true);
          this.form.markAsPristine();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(alertError(err));
        },
      });
  }
}
