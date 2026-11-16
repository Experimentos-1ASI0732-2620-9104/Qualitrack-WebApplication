import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DecimalPipe, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SidePanel } from '../../../../shared/presentation/components/side-panel/side-panel';
import { StatusChip } from '../../../../shared/presentation/components/status-chip/status-chip';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { CaStore } from '../../../application/ca.store';
import { ALERT_SEVERITY_CHIPS, ALERT_STATUS_CHIPS } from '../../alert-chips';
import { alertGauge } from '../../alert-gauge';
import { AlertAttentionFlow } from '../../alert-attention-flow';
import { alertVariableName } from '../../alert-variable';
import { AlertResolutionForm } from '../../components/alert-resolution-form/alert-resolution-form';
import { AlertTimeline } from '../../components/alert-timeline/alert-timeline';

/**
 * Detail of a deviation alert (US86), in a panel over the inbox: where it originated, how the incident evolved and the
 * actions of its container monitor. Operators and quality managers attend (US87) and resolve it (US88) from here;
 * everybody else, and a resolved alert, only reads.
 *
 * @remarks
 * It is the route `/alerts/:alertId`, which e-mails and the bell link to. With `panel=resolve` in the address the focus
 * starts on the corrective action. Closing goes back to wherever the person came from, or to the inbox when the panel
 * was the first thing they opened.
 */
@Component({
  selector: 'app-alert-detail-panel',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
    AlertResolutionForm,
    AlertTimeline,
    DateTimePipe,
    SidePanel,
    StatusChip,
  ],
  templateUrl: './alert-detail-panel.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-detail-panel.css',
})
export class AlertDetailPanel implements OnDestroy {
  protected readonly store = inject(CaStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly translate = inject(TranslateService);
  private readonly attentionFlow = inject(AlertAttentionFlow);
  private readonly injector = inject(Injector);
  private readonly sidePanel = viewChild(SidePanel);
  private readonly resolutionForm = viewChild(AlertResolutionForm);

  private readonly params = toSignal(this.route.paramMap);

  /** Numeric id of the alert in the route; 0 when the route has none or it is not a number. */
  private readonly alertId = computed(() => Number(this.params()?.get('alertId')) || 0);

  /** The alert shown, as the list knows it until its detail arrives. */
  protected readonly alert = computed(() => this.store.getAlertById(this.alertId())());

  /** Whether the person came to resolve the alert, so the focus starts on the corrective action. */
  protected readonly openedToResolve = this.route.snapshot.queryParamMap.get('panel') === 'resolve';

  /** Whether the corrective action was sent, to close the panel once it is saved. */
  private readonly resolving = signal(false);

  /** The reading against its limit, for the bar under the numbers. */
  protected readonly gauge = computed(() => {
    const alert = this.alert();
    return alert ? alertGauge(alert) : null;
  });

  protected readonly severityChip = computed(() => {
    const alert = this.alert();
    return alert ? ALERT_SEVERITY_CHIPS[alert.severity] : null;
  });
  protected readonly statusChip = computed(() => {
    const alert = this.alert();
    return alert ? ALERT_STATUS_CHIPS[alert.status] : null;
  });

  /** Name of the device that detected the deviation, or its identifier while it is unknown. */
  protected readonly deviceLabel = computed(() => {
    const alert = this.alert();
    return alert ? (this.store.deviceName(alert.equipmentId) ?? `#${alert.equipmentId}`) : '';
  });

  /** What deviated and where, which names the panel. */
  protected readonly title = computed(() => {
    const alert = this.alert();
    return alert
      ? `${alertVariableName(this.translate, alert.parameterName)} · ${this.deviceLabel()}`
      : this.translate.instant('ca-alerts.detail.alert');
  });

  /** Environment and number of the alert. */
  protected readonly subtitle = computed(() => {
    const alert = this.alert();
    if (!alert) return null;
    const environment = this.store.environments().find((item) => item.id === alert.environmentId);
    const environmentLabel = environment
      ? `${environment.code} · ${environment.name}`
      : this.translate.instant('ca-alerts.detail.no-environment');
    return `${environmentLabel} · ${this.translate.instant('ca-alerts.detail.alert')} #${alert.id}`;
  });

  /** Name of the person attending the alert. */
  protected readonly attendedBy = computed(() => this.personLabel(this.alert()?.acknowledgedBy));

  /** Name of the person who resolved the alert. */
  protected readonly resolvedBy = computed(() => this.personLabel(this.alert()?.resolvedBy));

  /** While the attention can still be undone, the toast outside the panel has to be reachable. */
  protected readonly canReachUndoToast = computed(() =>
    this.store.hasPendingAttention(this.alertId()),
  );

  constructor() {
    effect(() => {
      const alertId = this.alertId();
      untracked(() => {
        this.resolutionForm()?.reset();
        this.store.loadAlertById(alertId);
      });
    });

    effect(() => {
      const form = this.resolutionForm();
      if (form && this.openedToResolve) {
        afterNextRender(() => form.focus(), { injector: this.injector });
      }
    });

    effect(() => {
      if (!this.resolving() || this.store.saving()) return;
      this.resolving.set(false);
      if (!untracked(this.store.error)) untracked(() => this.close());
    });
  }

  ngOnDestroy(): void {
    this.store.clearSelectedAlert();
  }

  /** Goes back to where the person came from, or to the inbox when the panel was the first thing they opened. */
  protected close(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigate(['..'], {
        relativeTo: this.route,
        queryParams: { panel: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  /** Registers that the person attends the alert, giving a few seconds to undo it. */
  protected attend(): void {
    const alert = this.alert();
    if (!alert) return;
    // The button pressed disappears, and when the toast ends it takes the focus with it if it was there.
    this.attentionFlow.attend(alert, () => this.keepFocusInPanel());
    this.keepFocusInPanel();
  }

  /** E-mails the open critical alert again to the people of the laboratory (TS78). */
  protected notify(): void {
    this.attentionFlow.closeUndoWindow(this.alertId());
    this.store.sendAlertEmailNotification(this.alertId());
  }

  /**
   * Closes the alert with its corrective action (US88).
   *
   * @param resolutionNotes - The corrective action
   */
  protected resolve(resolutionNotes: string): void {
    this.attentionFlow.closeUndoWindow(this.alertId());
    this.resolving.set(true);
    this.store.resolveAlert(this.alertId(), { resolutionNotes });
  }

  /** Brings the focus back to the panel when what had it is gone. */
  private keepFocusInPanel(): void {
    afterNextRender(
      () => {
        const focused = document.activeElement;
        if (!focused || focused === document.body) this.sidePanel()?.focusTitle();
      },
      { injector: this.injector },
    );
  }

  private personLabel(userId: number | null | undefined): string | null {
    if (userId === null || userId === undefined) return null;
    return (
      this.store.personName(userId) ??
      this.translate.instant('ca-alerts.detail.user', { id: userId })
    );
  }
}
