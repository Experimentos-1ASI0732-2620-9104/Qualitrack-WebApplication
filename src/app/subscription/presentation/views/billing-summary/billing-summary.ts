import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SubscriptionStore } from '../../../application/subscription.store';
import { IamStore } from '../../../../iam/application/iam.store';

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
    CommonModule,
    DatePipe,
    RouterLink,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './billing-summary.html',
  styleUrl: './billing-summary.css',
})
export class BillingSummary implements OnInit {
  /**
   * Store responsible for subscription and payment state.
   */
  protected readonly store = inject(SubscriptionStore);

  /**
   * Store responsible for authentication state.
   */
  protected readonly iamStore = inject(IamStore);

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

  protected onCancelSubscription(): void {
    const subscription = this.store.currentSubscription();
    const userId = this.iamStore.currentUserId();

    if (!subscription || !userId) return;

    this.store.cancelSubscription(subscription.id, userId);
  }
}
