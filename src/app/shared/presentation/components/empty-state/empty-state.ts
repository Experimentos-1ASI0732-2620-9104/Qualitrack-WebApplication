import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Shared presentational component for empty states.
 *
 * @remarks
 * Reusable across the application to display a generic icon and a translated
 * message when a list or table has no data. An empty list can be good news, so the
 * state can have a title and a positive tone, and the view can project what to do next.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [TranslatePipe, MatIconModule],
  template: `
    <div class="empty-state" [class.positive]="positive()">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      @if (titleKey(); as titleKey) {
        <h2>{{ titleKey | translate }}</h2>
      }
      <p>{{ messageKey() | translate: messageParams() }}</p>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './empty-state.css',
})
export class EmptyState {
  /** Name of the Material icon to display. */
  readonly icon = input('manage_search');

  /** Translation key for the title, if any. */
  readonly titleKey = input<string | null>(null);

  /** Translation key for the message. */
  readonly messageKey = input.required<string>();

  /** Parameters of the message. */
  readonly messageParams = input<Record<string, unknown>>({});

  /** Whether being empty is good news. */
  readonly positive = input(false);
}
