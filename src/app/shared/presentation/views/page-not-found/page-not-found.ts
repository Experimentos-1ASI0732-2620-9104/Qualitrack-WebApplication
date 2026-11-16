import { Location } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SIGNED_IN } from '../../tokens/signed-in.token';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe, MatButtonModule, MatIconModule],
  templateUrl: './page-not-found.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './page-not-found.css',
})
export class PageNotFound implements OnInit {
  protected invalidPath = '';

  /** Whether the user is signed in: the main action opens the dashboard instead of the home page. */
  protected readonly isSignedIn = inject(SIGNED_IN);

  private readonly router = inject(Router);
  private readonly location = inject(Location);

  ngOnInit(): void {
    this.invalidPath = this.router.url || '/';
  }

  protected goBack(): void {
    this.location.back();
  }
}
