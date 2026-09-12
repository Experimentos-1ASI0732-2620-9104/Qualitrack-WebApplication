import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { IamStore } from '../../../application/iam.store';
import { onboardingDestination } from '../../../domain/model/onboarding-state';
import { Toolbar } from '../../../../shared/presentation/components/toolbar/toolbar';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [Toolbar, TranslateModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <app-toolbar />
    <main class="onboarding-status" aria-live="polite">
      @if (loading()) {
        <mat-spinner diameter="40" [attr.aria-label]="'onboarding.loading' | translate" />
        <p>{{ 'onboarding.loading' | translate }}</p>
      } @else {
        <h1>{{ 'onboarding.unavailable-title' | translate }}</h1>
        <p role="alert">{{ 'onboarding.connection-error' | translate }}</p>
        <button mat-flat-button (click)="resolve()">{{ 'onboarding.retry' | translate }}</button>
        <button mat-button (click)="signOut()">{{ 'onboarding.sign-out' | translate }}</button>
      }
    </main>
  `,
  styles: [`.onboarding-status { max-width: 560px; margin: 96px auto 24px; padding: 24px;
    text-align: center; } mat-spinner { margin: auto; } h1 { font-size: 24px; }`],
})
export class Onboarding {
  private readonly iam = inject(IamStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(true);

  constructor() { this.resolve(); }

  protected resolve(): void {
    this.loading.set(true);
    this.iam.loadOnboarding(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (state) => void this.router.navigateByUrl(onboardingDestination(state), { replaceUrl: true }),
      error: () => {
        this.loading.set(false);
        if (!this.iam.isSignedIn()) void this.router.navigateByUrl('/iam/sign-in');
      },
    });
  }

  protected signOut(): void { this.iam.signOut(this.router); }
}
