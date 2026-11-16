import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SubscriptionStore } from '../../../application/subscription.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { formatDate } from '../../../../shared/presentation/utils/date-time-format';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Component responsible for displaying subscription and payment information.
 *
 * @remarks
 * This standalone presentation component displays the current subscription
 * status and payment history for the authenticated laboratory context.
 */
@Component({
  selector: 'app-billing-summary',
  standalone: true,
  imports: [
    TablePaginator, CommonModule,
    DateOnlyPipe,
    RouterLink,
    TranslatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './billing-summary.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './billing-summary.css',
})
export class BillingSummary implements OnInit {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly paymentPage = paginate(() => this.store.payments());

  /**
   * Store responsible for subscription and payment state.
   */
  protected readonly store = inject(SubscriptionStore);

  /**
   * Store responsible for authentication state.
   */
  protected readonly iamStore = inject(IamStore);

  private readonly translate = inject(TranslateService);

  /**
   * Columns rendered in the payment history table.
   */
  protected readonly displayedColumns = ['createdAt', 'amount', 'provider', 'status'];

  /**
   * Lifecycle hook that loads subscription data.
   *
   * @remarks
   * Payment history is loaded by SubscriptionStore after the active subscription
   * is resolved, because the backend exposes payments by subscription ID.
   */
  ngOnInit(): void {
    const laboratoryId = this.iamStore.currentLaboratoryId();

    if (!laboratoryId) return;

    this.store.loadCurrentSubscription(laboratoryId);
  }

  /**
   * Maps a subscription or payment status to a CSS-friendly class.
   *
   * @param status - Raw status value
   * @returns CSS class suffix
   */
  protected getStatusClass(status?: string): string {
    return status ? status.toLowerCase().replace(/_/g, '-') : 'unknown';
  }

  /** Asks for confirmation and cancels the renewal; the subscription stays active until the end of the period. */
  protected onCancelRenewal(): void {
    const subscription = this.store.currentSubscription();

    if (!subscription || subscription.cancelAtPeriodEnd) return;
    const end = formatDate(subscription.currentPeriodEnd, this.translate.currentLang() || 'en');
    if (!confirm(this.translate.instant('subscription.billing.cancel-renewal-confirm', { end })))
      return;

    this.store.cancelRenewal(subscription.id);
  }
}
