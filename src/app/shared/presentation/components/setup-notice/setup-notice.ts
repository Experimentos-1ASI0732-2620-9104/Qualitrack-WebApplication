import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Notice for a view that cannot show anything until something is set up first.
 *
 * @remarks
 * Besides telling what is missing, it takes the person straight to where it is set up, so the
 * view is never a dead end. Whoever cannot set it up only reads the notice.
 */
@Component({
  selector: 'app-setup-notice',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="setup-notice" role="status">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <p class="message">{{ messageKey() | translate }}</p>
      @if (actionLink(); as actionLink) {
        <a mat-flat-button [routerLink]="actionLink">
          <mat-icon aria-hidden="true">{{ actionIcon() }}</mat-icon>
          {{ actionKey() | translate }}
        </a>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './setup-notice.css',
})
export class SetupNotice {
  /** Translation key of what is missing. */
  readonly messageKey = input.required<string>();

  /** Name of the Material icon of the notice. */
  readonly icon = input('info');

  /** Where it is set up; without it, no action is shown. */
  readonly actionLink = input<string | null>(null);

  /** Translation key of the action. */
  readonly actionKey = input('environments.register');

  /** Name of the Material icon of the action. */
  readonly actionIcon = input('add_location_alt');
}
