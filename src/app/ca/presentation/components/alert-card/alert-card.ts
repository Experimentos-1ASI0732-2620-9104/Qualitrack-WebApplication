import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { RelativeTimePipe } from '../../../../shared/presentation/pipes/relative-time.pipe';
import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { ALERT_SEVERITY_CHIPS } from '../../alert-chips';
import { alertGauge } from '../../alert-gauge';
import { alertVariableName } from '../../alert-variable';

/**
 * Card of an open alert in the inbox: how serious it is, in which step of its life cycle it is, how far it went past the
 * limit, how long it has been open and who attends it.
 *
 * @remarks
 * It only shows what it receives and tells the view what the person wants to do. Each card has a single primary
 * action, which depends on the state of the alert.
 */
@Component({
  selector: 'app-alert-card',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
    MatMenuModule,
    DateTimePipe,
    RelativeTimePipe,
  ],
  templateUrl: './alert-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-card.css',
})
export class AlertCard {
  /** Alert to show. */
  readonly alert = input.required<DeviationAlert>();

  /** Name of the device that detected the deviation, or null while it is unknown. */
  readonly deviceName = input<string | null>(null);

  /** Code and name of the environment of the alert, or null when it is unknown. */
  readonly environmentLabel = input<string | null>(null);

  /** Name of the person attending the alert, or null while it is unknown. */
  readonly attendedBy = input<string | null>(null);

  /** Whether the person can attend alerts; otherwise only the detail is offered. */
  readonly canAttend = input(false);

  /** Whether something is being saved, so the e-mail cannot be sent again yet. */
  readonly saving = input(false);

  /** Whether the alert just arrived, to catch the eye. */
  readonly isNew = input(false);

  /** Current time, kept by the view, to tell how long ago things happened. */
  readonly now = input.required<Date>();

  /** Emits when the person registers that they attend the alert. */
  readonly attend = output<void>();

  /** Emits when the person e-mails the alert again. */
  readonly notify = output<void>();

  /** Emits when the person is about to leave the inbox to see the alert. */
  readonly opening = output<void>();

  private readonly translate = inject(TranslateService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  private readonly primaryAction = viewChild('primaryAction', { read: ElementRef });

  /** Name of the severity, written out so the row does not rely on its color alone. */
  protected readonly severityChip = computed(() => ALERT_SEVERITY_CHIPS[this.alert().severity]);

  /** What deviated and where, which also tells apart the actions of each card. */
  protected readonly title = computed(() => {
    const alert = this.alert();
    const variable = alertVariableName(this.translate, alert.parameterName);
    return `${variable} · ${this.deviceName() ?? '#' + alert.equipmentId}`;
  });

  /** The reading against its limit, so the row shows how far the reading went past it. */
  protected readonly gauge = computed(() => alertGauge(this.alert()));

  /** Moves the focus to the card, to go through the list with the keyboard. */
  focus(): void {
    this.card().nativeElement.focus();
  }

  /**
   * Tells whether something on the page is part of this card.
   *
   * @param node - What to look for
   * @returns Whether it is inside the card
   */
  contains(node: Node): boolean {
    return this.host.nativeElement.contains(node);
  }

  /** Moves the focus to the main action of the card, for example after it changed. */
  focusPrimaryAction(): void {
    (this.primaryAction()?.nativeElement as HTMLElement | undefined)?.focus();
  }
}
