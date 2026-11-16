import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { Params, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { interval, map } from 'rxjs';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';

/** One operation of a module, shown as a tab under the title. */
export interface PageTab {
  /** Translation key of the name of the tab. */
  labelKey: string;
  /** Address of the operation; without it the tab is chosen in the page itself, by its `id`. */
  link?: string;
  /** Query parameters the link carries, such as the environment chosen. */
  queryParams?: Params;
  /** Identifier of a tab chosen in the page itself. */
  id?: string;
}

/**
 * Heading shared by the pages: the icon and the title, how fresh the data is, the refresh button, and the
 * operations of the module as tabs.
 *
 * @remarks
 * Next to the title there is only the time of the last update and the button to refresh: the actions of a page
 * go in its list toolbar. The time comes from `updatedAt`, or else from the moment `loading` last ended. The page
 * projects its content after the tabs.
 *
 * @example
 * ```html
 * <app-page-header icon="factory" titleKey="product-catalog.title" [tabs]="tabs" activeTab="/batches/environments"
 *   [loading]="store.loading()" (refresh)="reload()">
 *   …content…
 * </app-page-header>
 * ```
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    TranslatePipe,
    RelativeTimePipe,
  ],
  template: `
    <header class="page-header">
      <div class="heading">
        <h1>
          <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
          {{ title() ?? (titleKey() | translate) }}
        </h1>
        <div class="status">
          @if (refreshable() && lastUpdate(); as lastUpdate) {
            <span class="updated" role="status">
              <span class="updated-text">{{ 'common.updated' | translate: { time: (lastUpdate | relativeTime: now()) } }}</span>
            </span>
          }
          @if (refreshable()) {
            <button
              mat-icon-button
              type="button"
              class="refresh"
              [disabled]="loading()"
              [attr.aria-label]="'common.refresh' | translate"
              [matTooltip]="
                lastUpdate()
                  ? ('common.refresh' | translate) + ' · ' + ('common.updated' | translate: { time: (lastUpdate()! | relativeTime: now()) })
                  : ('common.refresh' | translate)
              "
              (click)="refresh.emit()"
            >
              <mat-icon aria-hidden="true">refresh</mat-icon>
            </button>
          }
        </div>
      </div>
      @if (subtitleKey(); as subtitleKey) {
        <p class="subtitle">{{ subtitleKey | translate }}</p>
      }

      @if (tabs().length) {
        <nav
          mat-tab-nav-bar
          mat-stretch-tabs="false"
          mat-align-tabs="start"
          [tabPanel]="panel()!"
          [attr.aria-label]="titleKey() | translate"
        >
          @for (tab of tabs(); track tab.labelKey) {
            @if (tab.link) {
              <a mat-tab-link [routerLink]="tab.link" [queryParams]="tab.queryParams" [active]="isActive(tab)">
                {{ tab.labelKey | translate }}
              </a>
            } @else {
              <a mat-tab-link href="" [active]="isActive(tab)" (click)="choose($event, tab)">
                {{ tab.labelKey | translate }}
              </a>
            }
          }
        </nav>
      }
    </header>

    <!-- The page under its tabs, or alone when it is the only operation of its module -->
    <ng-template #content><ng-content /></ng-template>
    @if (tabs().length) {
      <mat-tab-nav-panel #panel><ng-container [ngTemplateOutlet]="content" /></mat-tab-nav-panel>
    } @else {
      <ng-container [ngTemplateOutlet]="content" />
    }
  `,
  styleUrl: './page-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  /** Name of the Material icon of the page. */
  readonly icon = input.required<string>();

  /** Translation key of the title, also the name of its tabs for assistive technology. */
  readonly titleKey = input('');

  /** Title already written, such as the name of a laboratory; it takes the place of `titleKey`. */
  readonly title = input<string | null>(null);

  /** Translation key of the sentence that says what the page is for, under the title. */
  readonly subtitleKey = input<string | null>(null);

  /** Operations of the module; none means the page is a single operation. */
  readonly tabs = input<readonly PageTab[]>([]);

  /** Link or id of the tab of the page. */
  readonly activeTab = input<string | null>(null);

  /** Whether the data is being read; the button waits and the time is taken when it ends. */
  readonly loading = input(false);

  /** When the data was read; without it, the moment `loading` last ended. */
  readonly updatedAt = input<Date | string | null>(null);

  /** Whether the page offers to read its data again. */
  readonly refreshable = input(true);

  /** Emits when the person asks to read the data again. */
  readonly refresh = output<void>();

  /** Panel of the content under the tabs, which the tab bar points to. */
  protected readonly panel = viewChild(MatTabNavPanel);

  /** Emits the id of a tab chosen in the page itself. */
  readonly tabChosen = output<string>();

  /** Current time, to tell how long ago the data was read. */
  protected readonly now = toSignal(interval(1000).pipe(map(() => new Date())), {
    initialValue: new Date(),
  });

  /** Moment the last reading ended, while the page gives no time of its own. */
  private readonly loadedAt = signal<Date | null>(null);

  /** Time shown next to the title. */
  protected readonly lastUpdate = computed(() => this.updatedAt() ?? this.loadedAt());

  constructor() {
    let wasLoading: boolean | null = null;
    effect(() => {
      const loading = this.loading();
      if (!loading && wasLoading !== false) untracked(() => this.loadedAt.set(new Date()));
      wasLoading = loading;
    });
  }

  /**
   * Whether a tab is the one of the page.
   *
   * @param tab - The tab
   * @returns Whether it is active
   */
  protected isActive(tab: PageTab): boolean {
    return (tab.id ?? tab.link) === this.activeTab();
  }

  /**
   * Chooses a tab of the page itself, without leaving it.
   *
   * @param event - The click on the tab
   * @param tab - The tab
   */
  protected choose(event: Event, tab: PageTab): void {
    event.preventDefault();
    if (tab.id) this.tabChosen.emit(tab.id);
  }
}
