import { Component, OnInit, inject, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { EnvironmentStore } from '../../../application/environment.store';

/**
 * Selector of the environment in which other bounded contexts work (inventory, equipment, telemetry).
 *
 * @remarks
 * Belongs to Laboratory Management, the owner of environments. It only emits the selected
 * environment identifier; the hosting feature decides how to navigate.
 */
@Component({
  selector: 'app-environment-selector',
  standalone: true,
  imports: [TranslateModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="environment-selector">
      <mat-label>{{ 'environments.selector' | translate }}</mat-label>
      <mat-icon matPrefix aria-hidden="true">meeting_room</mat-icon>
      <mat-select [value]="selectedId()" (selectionChange)="selectedChange.emit($event.value)"
                  [attr.aria-label]="'environments.selector' | translate">
        @for (environment of store.environments(); track environment.id) {
          <mat-option [value]="environment.id">
            {{ environment.code }} · {{ environment.name }}
            @if (environment.usage) {
              <small class="usage">({{ 'environment-usage.' + environment.usage | translate }})</small>
            }
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: `
    .environment-selector { min-width: 280px; }
    .usage { color: #5f6368; }
    @media (max-width: 600px) { .environment-selector { width: 100%; min-width: 0; } }
  `,
})
export class EnvironmentSelector implements OnInit {
  /**
   * Store that provides the environments of the current laboratory.
   */
  protected readonly store = inject(EnvironmentStore);

  /**
   * Identifier of the environment currently shown by the hosting feature.
   */
  readonly selectedId = input<number | null>(null);

  /**
   * Emits the identifier of the environment chosen by the user.
   */
  readonly selectedChange = output<number>();

  /**
   * Lifecycle hook that loads the environments unless another view already loaded them.
   */
  ngOnInit(): void {
    if (!this.store.loaded()) void this.store.loadEnvironments();
  }
}
