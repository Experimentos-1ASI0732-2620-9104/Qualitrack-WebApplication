import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toIsoDate } from '../../../../shared/presentation/validators/date.validators';
import { BatchFilter, isBatchFilterApplied } from '../../batch-filter';

/**
 * Reads a `yyyy-MM-dd` day as a local date for the calendar.
 *
 * @param day - The day, or null
 * @returns The date at midnight in the browser time zone, or null
 */
function calendarDay(day: string | null): Date | null {
  if (!day) return null;
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

/**
 * Criteria of the batch list: text, environment and start period.
 *
 * @remarks
 * It keeps no state of its own: every change is emitted as the whole new criteria, and the view decides what to
 * show. The status is chosen through the indicators of the list, so it has no field here, although the clear button
 * also clears it. The period is picked in a calendar shown in the language of the interface; the days cannot be
 * typed, because the native date adapter would read them in the US order.
 *
 * @example
 * ```html
 * <app-batch-filters
 *   [filter]="filter()"
 *   [environments]="environments()"
 *   (filterChange)="filter.set($event)"
 *   (cleared)="clearFilters()"
 * />
 * ```
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-filters',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './batch-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './batch-filters.css',
})
export class BatchFilters {
  /** Current criteria. */
  readonly filter = input.required<BatchFilter>();

  /** Emits the new criteria after any change. */
  readonly filterChange = output<BatchFilter>();

  /** Asks to show every batch again. */
  readonly cleared = output<void>();

  /** Whether any criterion hides batches. */
  protected readonly applied = computed(() => isBatchFilterApplied(this.filter()));

  private readonly fromDay = computed(() => this.filter().from);
  private readonly toDay = computed(() => this.filter().to);

  /** First day of the period, as the calendar shows it. */
  protected readonly from = computed(() => calendarDay(this.fromDay()));

  /** Last day of the period, as the calendar shows it. */
  protected readonly to = computed(() => calendarDay(this.toDay()));

  /**
   * Period being picked.
   *
   * @remarks
   * Picking a day in the calendar changes both ends at once (the start, and the end that is cleared), before the
   * new criteria come back through {@link filter}; this copy keeps the first change when the second one is emitted.
   */
  private readonly period = linkedSignal(() => ({ from: this.fromDay(), to: this.toDay() }));

  constructor() {
    const dates = inject<DateAdapter<Date>>(DateAdapter);
    const translate = inject(TranslateService);
    effect(() => dates.setLocale(translate.currentLang() === 'es' ? 'es-PE' : 'en-US'));
  }

  /**
   * Emits the criteria with some values changed.
   *
   * @param changes - The criteria that change
   */
  protected patch(changes: Partial<BatchFilter>): void {
    this.filterChange.emit({ ...this.filter(), ...changes });
  }

  /**
   * Emits a new first or last start day picked in the calendar.
   *
   * @param bound - `from` for the first day, `to` for the last one
   * @param value - The picked date; null when that end is cleared
   */
  protected chooseDay(bound: 'from' | 'to', value: Date | null): void {
    this.period.update((period) => ({ ...period, [bound]: toIsoDate(value) }));
    this.patch(this.period());
  }
}
