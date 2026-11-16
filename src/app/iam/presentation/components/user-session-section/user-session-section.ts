import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IamStore } from '../../../application/iam.store';

/**
 * Displays the sign-out action of the authenticated session in the application toolbar.
 *
 * @remarks
 * The shared layout composes this IAM component beside the profile badge. IAM only owns the session action.
 */
@Component({
  selector: 'app-user-session-section',
  standalone: true,
  imports: [TranslatePipe, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './user-session-section.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './user-session-section.css',
})
export class UserSessionSection {
  /** Session store used to show and end the authenticated session. */
  protected readonly store = inject(IamStore);
  private readonly router = inject(Router);

  /** Ends the session and goes to the home page. */
  protected signOut(): void {
    this.store.signOut(this.router);
  }
}
