import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';

export interface PlanSwitchData {
  /** Plan that the person chose on the website, with its billing period. */
  chosen: string;
  /** Plan the account pays for now, with its billing period. */
  current: string;
  /** End of the period already paid, or null when the platform does not say. */
  periodEnd: string | null;
}

/** Tells someone with a subscription how to switch to the plan they chose, since the platform has no direct switch. */
@Component({
  selector: 'app-plan-switch-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle, RouterLink, TranslatePipe, DateOnlyPipe],
  template: `
    <h2 mat-dialog-title>{{ 'subscription.plan-switch.title' | translate }}</h2>
    <mat-dialog-content>
      <p>{{ 'subscription.plan-switch.summary' | translate: { chosen: data.chosen, current: data.current } }}</p>
      @if (data.periodEnd) {
        <p>{{ 'subscription.plan-switch.until' | translate: { date: (data.periodEnd | dateOnly) } }}</p>
      }
      <p>{{ 'subscription.plans.already-active' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">{{ 'subscription.plan-switch.later' | translate }}</button>
      <a mat-flat-button mat-dialog-close routerLink="/subscriptions/billing">{{ 'subscription.plan-switch.billing' | translate }}</a>
    </mat-dialog-actions>
  `,
})
export class PlanSwitchDialog {
  protected readonly data = inject<PlanSwitchData>(MAT_DIALOG_DATA);
}
