import { Component, computed, effect, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IamStore } from '../../../application/iam.store';
import { ProfileStore } from '../../../../profile/application/profile.store';

/**
 * Displays the authenticated user session in the application toolbar: the photo and name of the profile, which open
 * the profile, and the sign-out button.
 */
@Component({
  selector: 'app-user-session-section',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, TranslateModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './user-session-section.html',
  styleUrl: './user-session-section.css',
})
export class UserSessionSection {
  /** Session store: username, roles and onboarding state. */
  protected readonly store = inject(IamStore);
  /** Profile store: display name, initials and photo. */
  protected readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);

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

  /** Ends the session and goes to the home page. */
  protected signOut(): void {
    this.store.signOut(this.router);
  }
}
