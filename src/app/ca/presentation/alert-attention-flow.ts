import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { UndoToastOpener } from '../../shared/presentation/components/undo-toast/undo-toast';
import { CaStore } from '../application/ca.store';
import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { alertVariableName } from './alert-variable';

/**
 * Registers attention on an alert giving a few seconds to undo it, from any view that offers it.
 *
 * @remarks
 * It lives as long as the application on purpose: the attention must be sent or undone even if the person moved to
 * another page in the meantime.
 */
@Injectable({ providedIn: 'root' })
export class AlertAttentionFlow {
  private readonly store = inject(CaStore);
  private readonly translate = inject(TranslateService);
  private readonly undoToast = inject(UndoToastOpener);

  /**
   * Shows the alert as attended and opens the toast that can undo it; the attention is sent when the toast ends.
   *
   * @param alert - The alert
   * @param whenFinished - Called when the toast ended, whatever the person did
   */
  attend(alert: DeviationAlert, whenFinished?: () => void): void {
    const variable = alertVariableName(this.translate, alert.parameterName);
    const device = this.store.deviceName(alert.equipmentId) ?? `#${alert.equipmentId}`;
    this.store.startAttention(alert.id);
    this.undoToast
      .open({
        messageKey: 'ca-alerts.active.attention-registered',
        messageParams: { alert: `${variable} · ${device}` },
      })
      .subscribe((outcome) => {
        if (outcome === 'undone') this.store.undoAttention(alert.id);
        else this.store.confirmAttention(alert.id);
        whenFinished?.();
      });
  }

  /**
   * Ends the time to undo when the person moves on with the alert that is waiting for it.
   *
   * @param alertId - The alert the person is working with
   */
  closeUndoWindow(alertId: number): void {
    if (this.store.hasPendingAttention(alertId)) this.undoToast.confirmNow();
  }
}
