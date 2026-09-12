import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IamStore } from '../../../application/iam.store';

/**
 * Displays the authenticated user session in the application toolbar.
 */
@Component({
  selector: 'app-user-session-section',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './user-session-section.html',
  styleUrl: './user-session-section.css',
})
export class UserSessionSection {
  protected readonly store = inject(IamStore);
  private readonly router = inject(Router);

  protected signOut(): void {
    this.store.signOut(this.router);
  }
}
