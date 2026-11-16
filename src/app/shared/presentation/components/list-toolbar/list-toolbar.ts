import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

/** Width under which the filters start folded, so the data is what a phone shows first. */
const PHONE_WIDTH = 760;

let nextId = 0;

/**
 * Toolbar shared by the lists: what the list shows and how to add to it, then how to narrow it.
 *
 * @remarks
 * The first row holds the context of the list (`toolbarContext`, such as the environment selector) and, at its
 * right end, the buttons to create (`toolbarActions`). The second row holds the filters with their counts
 * (`toolbarFilters`), the search, which always offers an × to clear it, and the order (`toolbarSort`); anything
 * else that narrows the list goes under them (`toolbarMore`). The second row folds with an arrow; it starts folded
 * on a phone, where it would otherwise fill half of the screen, and says how many filters are in use while folded.
 *
 * @example
 * ```html
 * <app-list-toolbar searchKey="products.search" [search]="search()" (searchChange)="search.set($event)">
 *   <app-environment-selector toolbarContext … />
 *   <a toolbarActions mat-flat-button routerLink="new">…</a>
 *   <app-filter-chip toolbarFilters … />
 * </app-list-toolbar>
 * ```
 */
@Component({
  selector: 'app-list-toolbar',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, TranslatePipe],
  template: `
    <div class="toolbar">
      <div class="row primary">
        <div class="context"><ng-content select="[toolbarContext]" /></div>
        <div class="actions">
          <ng-content select="[toolbarActions]" />
          @if (filterable()) {
            <button
              mat-stroked-button
              type="button"
              class="toggle"
              [attr.aria-expanded]="expanded()"
              [attr.aria-controls]="filtersId"
              (click)="expanded.set(!expanded())"
            >
              <mat-icon aria-hidden="true">filter_list</mat-icon>
              {{ 'common.filters' | translate }}
              @if (!expanded() && activeFilters()) {
                <span class="count">{{ activeFilters() }}</span>
              }
              <mat-icon class="chevron" iconPositionEnd aria-hidden="true">{{
                expanded() ? 'expand_less' : 'expand_more'
              }}</mat-icon>
            </button>
          }
        </div>
      </div>

      @if (filterable()) {
        <div class="row filters" [id]="filtersId" [hidden]="!expanded()">
          <div class="chips"><ng-content select="[toolbarFilters]" /></div>
          <div class="find">
            @if (searchKey(); as searchKey) {
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
                <mat-icon matPrefix aria-hidden="true">search</mat-icon>
                <input
                  #searchInput
                  matInput
                  type="search"
                  [value]="search()"
                  [placeholder]="searchKey | translate"
                  [attr.aria-label]="searchKey | translate"
                  (input)="searchChange.emit(searchInput.value)"
                  (keydown.escape)="clear()"
                />
                @if (search()) {
                  <button
                    matSuffix
                    mat-icon-button
                    type="button"
                    class="clear"
                    [attr.aria-label]="'common.clear-search' | translate"
                    (click)="clear()"
                  >
                    <mat-icon aria-hidden="true">close</mat-icon>
                  </button>
                }
              </mat-form-field>
            }
            <ng-content select="[toolbarSort]" />
          </div>
          <div class="more"><ng-content select="[toolbarMore]" /></div>
        </div>
      }
    </div>
  `,
  styleUrl: './list-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbar {
  /** Translation key of the placeholder of the search; without it there is no search. */
  readonly searchKey = input<string | null>(null);

  /** Text searched. */
  readonly search = input('');

  /** Whether the list has a second row of filters, which can fold. */
  readonly filterable = input(true);

  /** How many filters narrow the list, which the folded row tells. */
  readonly activeFilters = input(0);

  /** Emits the text searched as the person writes it, and an empty text when it is cleared. */
  readonly searchChange = output<string>();

  /** Whether the row of filters is open; it starts folded on a phone. */
  protected readonly expanded = signal(
    typeof window === 'undefined' || !window.matchMedia
      ? true
      : !window.matchMedia(`(max-width: ${PHONE_WIDTH}px)`).matches,
  );

  /** Identifier of the row of filters, which the toggle controls. */
  protected readonly filtersId = `list-toolbar-filters-${nextId++}`;

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** Clears the search and keeps the focus in it. */
  protected clear(): void {
    this.searchChange.emit('');
    const input = this.searchInput()?.nativeElement;
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}
