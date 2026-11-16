import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Shared presentational component for error messages.
 *
 * @remarks
 * Reusable banner to display translated error keys. It optionally allows a
 * dismiss button to clear the error from the parent view.
 */
@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [TranslatePipe, MatIconModule, MatButtonModule],
  template: `
    <div class="error-message" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <span class="message">{{ messageKey() | translate }}</span>
      @if (dismissible()) {
        <button
          mat-icon-button
          type="button"
          (click)="dismiss.emit()"
          [attr.aria-label]="'common.close' | translate">
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './error-banner.css',
})
export class ErrorBanner {
  /** Translation key for the error message. */
  readonly messageKey = input.required<string>();

  /** Indicates if the close button should be displayed. */
  readonly dismissible = input(false);

  /** Emits an event when the user clicks the close button. */
  readonly dismiss = output<void>();
}
