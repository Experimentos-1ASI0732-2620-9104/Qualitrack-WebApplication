import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBar,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';

const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_UNDO_WINDOW_MS = 5000;

/** What an undo toast shows. */
export interface UndoToastData {
  /** Translation key of the message. */
  messageKey: string;
  /** Parameters of the message. */
  messageParams?: Record<string, unknown>;
  /** How long the action can be undone; 5 seconds by default. */
  durationMs?: number;
}

/**
 * Toast that gives a few seconds to undo an action, with a bar that shows the time left.
 *
 * @remarks
 * The time stops while the pointer or the focus is on the toast, so nobody runs out of time reaching the button
 * (WCAG 2.2.1). People who prefer reduced motion see a countdown instead of the moving bar. The bar and the countdown
 * are hidden from assistive technology: the message is announced once by the snack bar.
 *
 * Open it through {@link UndoToastOpener}.
 */
@Component({
  selector: 'app-undo-toast',
  standalone: true,
  imports: [
    MatButtonModule,
    MatSnackBarAction,
    MatSnackBarActions,
    MatSnackBarLabel,
    TranslatePipe,
  ],
  template: `
    <div
      class="undo-toast"
      (pointerenter)="hovered.set(true)"
      (pointerleave)="hovered.set(false)"
      (focusin)="focused.set(true)"
      (focusout)="focused.set(false)"
    >
      <span matSnackBarLabel>{{ data.messageKey | translate: data.messageParams }}</span>
      <span class="countdown" aria-hidden="true">{{ secondsLeft() }} s</span>
      <div matSnackBarActions>
        <button mat-button matSnackBarAction type="button" class="undo-action" (click)="undo()">
          {{ 'common.undo' | translate }}
        </button>
      </div>
      <div class="progress" aria-hidden="true">
        <div
          class="progress-bar"
          [style.animation-duration.ms]="durationMs"
          [class.paused]="paused()"
        ></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './undo-toast.css',
})
export class UndoToast implements OnDestroy {
  protected readonly data = inject<UndoToastData>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject<MatSnackBarRef<UndoToast>>(MatSnackBarRef);

  /** Length of the whole undo window. */
  protected readonly durationMs = this.data.durationMs ?? DEFAULT_UNDO_WINDOW_MS;
  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);
  /** Whether the time is stopped. */
  protected readonly paused = computed(() => this.hovered() || this.focused());
  /** Whole seconds left, rounded up. */
  protected readonly secondsLeft = signal(Math.ceil(this.durationMs / MILLISECONDS_PER_SECOND));

  private remainingMs = this.durationMs;
  private tickStartedAt = 0;
  private tickTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      if (this.paused()) this.stopTime();
      else this.startTick();
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.tickTimer);
  }

  /** Closes the toast telling whoever opened it that the action was undone. */
  protected undo(): void {
    this.snackBarRef.dismissWithAction();
  }

  /** Stops the time, keeping what is left of the current wait. */
  private stopTime(): void {
    clearTimeout(this.tickTimer);
    this.remainingMs -= Date.now() - this.tickStartedAt;
  }

  /**
   * Waits until the next whole second, or until the time runs out, whichever is first.
   *
   * @remarks
   * A single timer moves the countdown and ends the window, so they cannot disagree.
   */
  private startTick(): void {
    const untilNextSecond = this.remainingMs % MILLISECONDS_PER_SECOND || MILLISECONDS_PER_SECOND;
    this.tickStartedAt = Date.now();
    this.tickTimer = setTimeout(() => this.finishTick(untilNextSecond), untilNextSecond);
  }

  /**
   * Counts a finished wait and closes the toast when no time is left.
   *
   * @param elapsedMs - How long the wait lasted
   */
  private finishTick(elapsedMs: number): void {
    this.remainingMs -= elapsedMs;
    this.secondsLeft.set(Math.ceil(this.remainingMs / MILLISECONDS_PER_SECOND));
    if (this.remainingMs <= 0) this.snackBarRef.dismiss();
    else this.startTick();
  }
}

/** How the undo window of a toast ended. */
export type UndoToastOutcome = 'undone' | 'confirmed';

/**
 * Opens {@link UndoToast} and tells how it ended.
 *
 * @remarks
 * Only one toast is shown at a time: opening another one closes the previous one, which ends as `confirmed`.
 */
@Injectable({ providedIn: 'root' })
export class UndoToastOpener {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Shows the toast.
   *
   * @param data - What the toast shows
   * @returns Observable that emits once when the toast closes: `undone` if the person pressed the button, otherwise
   * `confirmed`
   */
  open(data: UndoToastData): Observable<UndoToastOutcome> {
    return this.snackBar
      .openFromComponent(UndoToast, { data, politeness: 'polite', panelClass: 'undo-toast-panel' })
      .afterDismissed()
      .pipe(map(({ dismissedByAction }) => (dismissedByAction ? 'undone' : 'confirmed')));
  }

  /** Closes the toast on screen, if any, which ends as `confirmed`. */
  confirmNow(): void {
    this.snackBar.dismiss();
  }
}
