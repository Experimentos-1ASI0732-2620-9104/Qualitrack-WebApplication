import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

/** Color family of a status chip; `outlined` is a white chip with a border. */
export type StatusChipTone = 'danger' | 'warning' | 'neutral' | 'outlined' | 'info' | 'success';

/**
 * Shared presentational component for a status: it always combines color, icon and text.
 *
 * @remarks
 * A visual component without domain logic: the bounded context decides which tone, icon and text each of its
 * statuses uses. The status is never told by the color alone (WCAG 1.4.1).
 */
@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [TranslatePipe, MatIconModule],
  template: `
    <span class="status-chip" [class]="'status-chip tone-' + tone()">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      {{ labelKey() | translate }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './status-chip.css',
})
export class StatusChip {
  /** Color family of the chip. */
  readonly tone = input.required<StatusChipTone>();

  /** Name of the Material icon to display. */
  readonly icon = input.required<string>();

  /** Translation key of the text. */
  readonly labelKey = input.required<string>();
}
