import { DOCUMENT } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { CdkPortal, PortalModule } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/** Below the other overlays, which are 1000, so that a toast opened before the panel still shows over it. */
const PANEL_OVERLAY_Z_INDEX = '999';

/** Tells apart the title of each panel, so that its dialog can name itself after it. */
let nextPanelId = 0;

/**
 * Panel that slides over a page to work on one of its items without leaving it.
 *
 * @remarks
 * It opens in an overlay, so that it covers the whole application whatever its layers. It is a modal dialog: it keeps the focus inside, closes with Escape, the close button or a click outside, and gives
 * the focus back to whatever had it. The hosting view decides what closing means, usually navigating. It projects the
 * content, `[sidePanelOverline]` above the title and `[sidePanelActions]` in the footer.
 */
@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [A11yModule, PortalModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <ng-template cdkPortal>
      <div class="backdrop" aria-hidden="true" (click)="closed.emit()"></div>
      <aside
        class="panel qt-theme"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [cdkTrapFocus]="trapFocus()"
      >
        <header class="panel-header">
          <div class="heading">
            <ng-content select="[sidePanelOverline]" />
            <h2 #title class="title" tabindex="-1" [id]="titleId">
              {{ titleText() }}
            </h2>
            @if (subtitle(); as subtitle) {
              <p class="subtitle">{{ subtitle }}</p>
            }
          </div>
          <button
            mat-icon-button
            type="button"
            [attr.aria-label]="'common.close' | translate"
            (click)="closed.emit()"
          >
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
        </header>
        <div class="panel-body"><ng-content /></div>
        <footer class="panel-footer"><ng-content select="[sidePanelActions]" /></footer>
      </aside>
    </ng-template>
  `,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './side-panel.css',
})
export class SidePanel implements AfterViewInit, OnDestroy {
  /** Title of the panel, which also names the dialog. */
  readonly titleText = input.required<string>();

  /** Line below the title. */
  readonly subtitle = input<string | null>(null);

  /** Whether the focus stays inside; turned off while something outside must be reachable, such as an undo toast. */
  readonly trapFocus = input(true);

  /** Whether the focus starts on the title; otherwise the view moves it to what the person came to do. */
  readonly focusTitleOnOpen = input(true);

  /** Emits when the person asks to close the panel. */
  readonly closed = output<void>();

  protected readonly titleId = `side-panel-title-${nextPanelId++}`;
  private readonly title = viewChild<ElementRef<HTMLElement>>('title');
  private readonly portal = viewChild.required(CdkPortal);
  private readonly overlay = inject(Overlay);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private overlayRef: OverlayRef | null = null;
  private previouslyFocused: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global(),
      width: '100%',
      height: '100%',
    });
    this.overlayRef.hostElement.style.zIndex = PANEL_OVERLAY_Z_INDEX;
    this.previouslyFocused = this.document.activeElement as HTMLElement | null;
    this.overlayRef.attach(this.portal());
    afterNextRender(
      () => {
        if (this.focusTitleOnOpen()) this.focusTitle();
      },
      { injector: this.injector },
    );
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
    this.previouslyFocused?.focus();
  }

  /** Moves the focus to the title, for example after the control that had it disappeared. */
  focusTitle(): void {
    this.title()?.nativeElement.focus();
  }
}
