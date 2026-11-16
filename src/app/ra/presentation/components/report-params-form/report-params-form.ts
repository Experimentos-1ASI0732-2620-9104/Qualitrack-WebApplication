import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { ReportGeneratorState } from '../../views/report-generator/report-generator.state';
import { RaStore } from '../../../application/ra.store';
import { ReportOrder } from '../../../domain/model/report-order';
import { IamStore } from '../../../../iam/application/iam.store';
import { localIsoDate } from '../../../../shared/presentation/utils/local-date';
import { MAX_REPORT_DAYS, PERIOD_ERROR_KEYS, periodError } from '../../utils/report-period';
import { ReportPreviewDialog } from '../report-preview-dialog/report-preview-dialog';

/**
 * Component for configuring and generating the selected report.
 *
 * @remarks
 * Renders the dynamic form based on the selected report type. It handles
 * the validation of required fields and date ranges before dispatching
 * generation commands to the {@link RaStore}.
 */
@Component({
  selector: 'app-report-params-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslatePipe, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonToggleModule, MatButtonModule, MatTooltipModule
  ],
  templateUrl: './report-params-form.html',
  styleUrl: './report-params-form.css'
})
export class ReportParamsForm {
  /** Service to open the preview dialog. */
  private dialog = inject(MatDialog);

  /** The shared state managing the report form values. */
  protected state = inject(ReportGeneratorState);

  /** The application store managing the Reporting and Analysis state. */
  protected store = inject(RaStore);

  /** The identity store to retrieve the current laboratory ID. */
  protected iamStore = inject(IamStore);

  /** Available batches for the batch report. */
  protected readonly batches = computed(() => this.store.overviewBatches().data ?? []);

  /** Available equipment that is located in an environment. */
  protected readonly locatedEquipment = computed(() => (this.store.overviewEquipment().data ?? []).filter(e => e.environmentId !== null));

  /** Translation key of what is wrong with the period chosen, or null when it is fine or the report has no period. */
  protected readonly periodErrorKey = computed(() => {
    const form = this.state.form();
    if (form.type !== 'compliance' && form.type !== 'equipment') return null;
    const error = periodError(form.startDate, form.endDate, MAX_REPORT_DAYS);
    return error ? PERIOD_ERROR_KEYS[error] : null;
  });

  /** Returns the translation key for the current report type title. */
  protected getTitle(): string {
    const titles: Record<string, string> = {
      batch: 'report-generator.batch.title',
      compliance: 'report-generator.compliance.title',
      inventory: 'report-generator.inventory.title',
      equipment: 'report-generator.equipment.title'
    };
    return titles[this.state.type()];
  }

  /**
   * Sets a quick date range based on the last N days.
   *
   * @param days - Number of days to subtract from today
   */
  protected setQuickDate(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    this.state.updateForm({ startDate: start, endDate: end });
  }

  /** Computes whether the current form state is valid to generate a report. */
  protected readonly isValid = computed(() => {
    const form = this.state.form();
    if (form.type === 'batch') return !!form.batchId;
    if (form.type === 'inventory') return true;
    if (form.type === 'compliance') {
      return !!form.startDate && !!form.endDate && !periodError(form.startDate, form.endDate, MAX_REPORT_DAYS);
    }
    if (form.type === 'equipment') {
      return !!form.equipmentId && !!form.startDate && !!form.endDate && !periodError(form.startDate, form.endDate, MAX_REPORT_DAYS);
    }
    return false;
  });

  /**
   * Generates the report once and shows it in a dialog, from which it can be downloaded without generating it again.
   */
  protected async onPreview(): Promise<void> {
    const order = this.order();
    if (!order) return;
    const file = await this.store.previewReport(order);
    if (!file) return;
    this.dialog.open(ReportPreviewDialog, {
      width: '900px',
      maxWidth: '95vw',
      height: '85vh',
      panelClass: 'custom-dialog-container',
      data: { file, title: this.getTitle() },
    });
  }

  /**
   * Downloads the selected report: the one already generated for the preview when its parameters did not change,
   * otherwise a new one.
   */
  protected onGenerate(): void {
    const order = this.order();
    if (order) this.store.generateReport(order);
  }

  /**
   * The report described by the form.
   *
   * @returns The type and command of the report, or null while the form is not valid
   */
  private order(): ReportOrder | null {
    if (!this.isValid()) return null;
    const form = this.state.form();
    const laboratoryId = this.iamStore.requireLaboratoryId();
    switch (form.type) {
      case 'batch':
        return { type: 'batch', command: { batchId: form.batchId!, includeDeviations: true, format: form.format } };
      case 'compliance':
        return {
          type: 'compliance',
          command: {
            laboratoryId,
            environmentId: form.environmentId || null,
            startDate: localIsoDate(form.startDate!),
            endDate: localIsoDate(form.endDate!),
            format: form.format,
          },
        };
      case 'inventory':
        return { type: 'inventory', command: { laboratoryId, environmentId: form.environmentId || null, format: form.format } };
      case 'equipment': {
        const equipment = this.locatedEquipment().find((item) => item.id === form.equipmentId);
        if (!equipment?.environmentId) return null;
        return {
          type: 'equipment',
          command: {
            laboratoryId,
            environmentId: equipment.environmentId,
            equipmentId: form.equipmentId!,
            startDate: localIsoDate(form.startDate!),
            endDate: localIsoDate(form.endDate!),
            format: form.format,
          },
        };
      }
    }
  }
}
