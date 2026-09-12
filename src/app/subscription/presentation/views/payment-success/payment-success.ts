import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, catchError, exhaustMap, of, switchMap, take, takeWhile, timer } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { onboardingDestination } from '../../../../iam/domain/model/onboarding-state';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css',
})
export class PaymentSuccess {
  private readonly iam = inject(IamStore);
  private readonly router = inject(Router);
  private readonly retry = new Subject<void>();
  protected readonly status = signal<'loading' | 'pending' | 'error' | 'confirmed'>('loading');

  constructor() {
    this.retry.pipe(
      switchMap(() => timer(0, 2000).pipe(
        take(15),
        exhaustMap(() => this.iam.loadOnboarding(true).pipe(catchError(() => of(null)))),
        takeWhile((state) => state !== null && state.subscriptionStatus !== 'ACTIVE', true),
      )),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((state) => {
      if (!state) {
        this.status.set('error');
      } else if (state.subscriptionStatus === 'ACTIVE') {
        this.status.set('confirmed');
        void this.router.navigateByUrl(onboardingDestination(state), { replaceUrl: true });
      } else {
        this.status.set('pending');
      }
    });
    this.verify();
  }

  protected verify(): void {
    this.status.set('loading');
    this.retry.next();
  }
}
