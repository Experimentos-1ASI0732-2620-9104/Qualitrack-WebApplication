import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

/**
 * Environment that the selector offers: what a view shows of the environments it works with.
 */
export interface EnvironmentOption {
  id: number;
  code: string;
  name: string;
  usage?: string | null;
}

/** Value of the option that stands for every environment; `mat-select` treats `null` as clearing the selection. */
const ALL_ENVIRONMENTS = 'all';

/**
 * How the selector looks: a form field (`field`), or a line of context under the title of a page (`inline`),
 * which reads as "the environment you are looking at" and opens the same list.
 */
export type EnvironmentSelectorAppearance = 'field' | 'inline';

/**
 * Selector of the environment in which a view works (inventory, products, alerts, telemetry, reports).
 *
 * @remarks
 * A visual component without domain logic: the hosting view passes the environments of its own context and
 * decides what to do with the selected one. A view that can also work with every environment passes
 * `allOptionKey` to offer that option, shown as selected while `selectedId` is null.
 *
 * With `appearance="inline"` it shows the chosen environment as a line under the title of the page: its code and
 * name, cut with an ellipsis when they do not fit (the whole text is its tooltip). Its list shows each environment in
 * two lines, with its usage. It keeps the keyboard and screen reader behavior of `mat-select`.
 *
 * @example
 * ```html
 * <app-environment-selector
 *   appearance="inline"
 *   [environments]="store.environments()"
 *   [selectedId]="store.productEnvironmentId()"
 *   (selectedChange)="changeEnvironment($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-environment-selector',
  standalone: true,
  imports: [TranslatePipe, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <!-- A line of context with nothing to choose only reads as a stray word; the view tells what is missing. -->
    @if (appearance() === 'inline' && !environments().length) {
    } @else if (appearance() === 'inline') {
      <mat-select
        #inline
        class="environment-inline"
        panelClass="environment-panel"
        panelWidth=""
        [value]="selectedValue()"
        [placeholder]="'environments.selector' | translate"
        [attr.title]="selectedLabel()"
        (selectionChange)="select($event.value)"
        [aria-label]="'environments.selector' | translate"
      >
        <mat-select-trigger>
          <span class="inline-trigger">
            <mat-icon aria-hidden="true">meeting_room</mat-icon>
            @if (selectedEnvironment(); as environment) {
              <span class="code">{{ environment.code }}</span>
              <span class="name">· {{ environment.name }}</span>
            } @else if (allOptionKey(); as allOptionKey) {
              <span class="code">{{
                allOptionKey | translate: { count: environments().length }
              }}</span>
            }
            <mat-icon class="chevron" aria-hidden="true">{{
              inline.panelOpen ? 'expand_less' : 'expand_more'
            }}</mat-icon>
          </span>
        </mat-select-trigger>
        @if (allOptionKey(); as allOptionKey) {
          <mat-option [value]="allEnvironments">
            <span class="option-top">{{
              allOptionKey | translate: { count: environments().length }
            }}</span>
          </mat-option>
        }
        @for (environment of environments(); track environment.id) {
          <mat-option [value]="environment.id">
            <span class="option-top">
              <span class="option-code">{{ environment.code }}</span>
              @if (environment.usage) {
                <span class="option-usage">{{
                  'environment-usage.' + environment.usage | translate
                }}</span>
              }
            </span>
            <span class="option-name">{{ environment.name }}</span>
          </mat-option>
        }
      </mat-select>
    } @else {
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="environment-selector">
        <mat-label>{{ 'environments.selector' | translate }}</mat-label>
        <mat-icon matPrefix aria-hidden="true">meeting_room</mat-icon>
        <mat-select
          [value]="selectedValue()"
          (selectionChange)="select($event.value)"
          [attr.aria-label]="'environments.selector' | translate"
        >
          @if (allOptionKey(); as allOptionKey) {
            <mat-option [value]="allEnvironments">
              {{ allOptionKey | translate: { count: environments().length } }}
            </mat-option>
          }
          @for (environment of environments(); track environment.id) {
            <mat-option [value]="environment.id">
              {{ environment.code }} · {{ environment.name }}
              @if (environment.usage) {
                <small class="usage"
                  >({{ 'environment-usage.' + environment.usage | translate }})</small
                >
              }
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './environment-selector.css',
})
export class EnvironmentSelector {
  /** Environments to choose from. */
  readonly environments = input.required<readonly EnvironmentOption[]>();

  /** Identifier of the selected environment, or null when none is selected. */
  readonly selectedId = input<number | null>(null);

  /** Translation key of the option for every environment, which receives `count`; without it, no option is offered. */
  readonly allOptionKey = input<string | null>(null);

  /** How the selector looks; a form field unless the view asks for the line under its title. */
  readonly appearance = input<EnvironmentSelectorAppearance>('field');

  /** Emits the identifier of the environment the user selects. */
  readonly selectedChange = output<number>();

  /** Emits when the user selects the option for every environment. */
  readonly allSelected = output<void>();

  protected readonly allEnvironments = ALL_ENVIRONMENTS;

  /** Environment shown as chosen; null while every environment or none is chosen. */
  protected readonly selectedEnvironment = computed(
    () => this.environments().find((environment) => environment.id === this.selectedId()) ?? null,
  );

  /** Code and name of the chosen environment, whole, for the tooltip of the inline selector. */
  protected readonly selectedLabel = computed(() => {
    const environment = this.selectedEnvironment();
    return environment ? `${environment.code} · ${environment.name}` : null;
  });

  /** Value the select shows as chosen. */
  protected readonly selectedValue = computed(() => {
    const selectedId = this.selectedId();
    return selectedId === null && this.allOptionKey() ? ALL_ENVIRONMENTS : selectedId;
  });

  /**
   * Tells the view what the user selected.
   *
   * @param value - The value of the chosen option
   */
  protected select(value: number | typeof ALL_ENVIRONMENTS): void {
    if (value === ALL_ENVIRONMENTS) this.allSelected.emit();
    else this.selectedChange.emit(value);
  }
}
