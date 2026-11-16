import { Component, computed, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MatTooltipModule } from '@angular/material/tooltip';

import { IamStore } from '../../../../iam/application/iam.store';
import { ProfileStore } from '../../../application/profile.store';

/**
 * Displays the signed-in user profile in the application toolbar: photo or initials, name and role.
 *
 * @remarks
 * The shared layout composes this Profile component beside the IAM sign-out component. Only the session is read
 * from IAM; profile data and its loading remain inside the Profile bounded context.
 */
@Component({
  selector: 'app-user-profile-badge',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    TranslatePipe,
    MatTooltipModule,
  ],
  templateUrl: './user-profile-badge.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './user-profile-badge.css',
})
export class UserProfileBadge {
  /** Session store: username, roles and onboarding state. */
  protected readonly store = inject(IamStore);
  /** Profile store: display name, initials and photo. */
  protected readonly profile = inject(ProfileStore);

  /** The profile can be opened once the account finished its setup (subscription and laboratory). */
  protected readonly canOpenProfile = computed(() => this.store.onboarding()?.nextStep === 'READY');

  /** Translation key of the first role of the user, or null without roles. */
  protected readonly roleKey = computed(() => {
    const role = this.store.currentRoles()[0];
    return role ? `profile.roles.${role}` : null;
  });

  /** Loads the profile (name and photo) once the account finished its setup. */
  constructor() {
    effect(() => {
      if (this.canOpenProfile()) this.profile.ensureLoaded();
    });
  }

}
