import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { IamStore } from '../../../../iam/application/iam.store';
import { Toolbar } from '../../components/toolbar/toolbar';

/**
 * Page rendered when users navigate to an unknown route.
 */
@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe, MatButtonModule, MatIconModule, Toolbar],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
})
export class PageNotFound implements OnInit {
  protected invalidPath = '';

  protected readonly iamStore = inject(IamStore);

  private readonly router = inject(Router);
  private readonly location = inject(Location);

  ngOnInit(): void {
    this.invalidPath = this.router.url || '/';
  }

  protected goBack(): void {
    this.location.back();
  }
}
