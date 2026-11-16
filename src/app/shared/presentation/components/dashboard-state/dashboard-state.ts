import { Component, input, output } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Shared state component for dashboard sections.
 *
 * @remarks
 * Displays a spinner when loading, or an error message with a retry button.
 * Replaces the use of `<ng-template>` to keep the views clean.
 */
@Component({
  imports: [
    MatProgressSpinner,
    MatIcon,
    MatIconButton,
    MatTooltip,
    TranslatePipe
  ],
  selector: 'app-dashboard-state',
  styleUrl: './dashboard-state.css',
  templateUrl: './dashboard-state.html',
})
export class DashboardState {

  /** The current state: 'loading' or 'error'. */
  readonly state = input.required<string>();

  /** Emits when the user clicks the retry button. */
  readonly retry = output<void>();
}
