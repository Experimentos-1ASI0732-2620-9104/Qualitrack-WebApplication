import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Chip that turns a filter on or off and tells how many results it leaves.
 *
 * @remarks
 * A visual component without domain logic: the hosting view decides what is pressed, what the count is and what
 * pressing it means. The state reaches assistive technology through `aria-pressed`, and the chip is a real button, so
 * it works with the keyboard.
 */
@Component({
  selector: 'app-filter-chip',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <button
      type="button"
      class="filter-chip"
      [class.pressed]="pressed()"
      [class.danger]="tone() === 'danger'"
      [attr.aria-pressed]="pressed()"
      (click)="toggled.emit()"
    >
      @if (pressed()) {
        <mat-icon class="check" aria-hidden="true">check</mat-icon>
      } @else if (icon(); as icon) {
        <mat-icon aria-hidden="true">{{ icon }}</mat-icon>
      }
      {{ labelKey() | translate }}
      @if (count() !== null) {
        <span class="count">{{ count() }}</span>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './filter-chip.css',
})
export class FilterChip {
  /** Translation key of the text. */
  readonly labelKey = input.required<string>();

  /** Name of the Material icon before the text, if any; a pressed chip shows a check instead. */
  readonly icon = input<string | null>(null);

  /** How many results the chip leaves, or `null` to show no count. */
  readonly count = input<number | null>(null);

  /** Whether the filter is applied. */
  readonly pressed = input(false);

  /** Color of the chip: `danger` for what needs attention right away. */
  readonly tone = input<'neutral' | 'danger'>('neutral');

  /** Emits when the person presses the chip. */
  readonly toggled = output<void>();
}
