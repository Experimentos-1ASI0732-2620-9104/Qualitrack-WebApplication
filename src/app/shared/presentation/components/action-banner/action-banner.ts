import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/** How urgent a banner is. */
export type ActionBannerTone = 'danger' | 'warning';

/**
 * Banner that tells what needs attention right now and offers the way to deal with it.
 *
 * @remarks
 * The hosting view projects the message. It is announced as an alert when it appears or changes.
 */
@Component({
  selector: 'app-action-banner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="action-banner" [class]="'tone-' + tone()" role="alert">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <div class="message"><ng-content /></div>
      @if (actionKey(); as actionKey) {
        <button mat-stroked-button type="button" (click)="action.emit()">
          {{ actionKey | translate }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './action-banner.css',
})
export class ActionBanner {
  /** Name of the Material icon of the banner. */
  readonly icon = input('error');

  /** How urgent it is. */
  readonly tone = input<ActionBannerTone>('danger');

  /** Translation key of the action; without it, no button is shown. */
  readonly actionKey = input<string | null>(null);

  /** Emits when the person presses the action. */
  readonly action = output<void>();
}
