import { Injectable, signal } from '@angular/core';
import { ALL_ENVIRONMENTS } from '../../../domain/model/indicator-period';

/** The available types of reports that can be generated. */
export type ReportType = 'batch' | 'compliance' | 'inventory' | 'equipment';

/** Configuration and form state for generating a report. */
export interface ReportConfig {
  type: ReportType;
  batchId: number | null;
  equipmentId: number | null;
  environmentId: number;
  startDate: Date | null;
  endDate: Date | null;
  format: 'PDF' | 'CSV';
}

/**
 * State manager for the Report Generator feature.
 *
 * @remarks
 * This service is provided at the component level (not root) to ensure that
 * the report configuration is fresh every time the user navigates to the view.
 * It uses Angular Signals to maintain the selected report type and form values.
 */
@Injectable()
export class ReportGeneratorState {
  /** The currently selected type of report. */
  readonly type = signal<ReportType>('compliance');

  /** The current configuration values of the report form. */
  readonly form = signal<ReportConfig>({
    type: 'compliance',
    batchId: null,
    equipmentId: null,
    environmentId: ALL_ENVIRONMENTS,
    startDate: null,
    endDate: null,
    format: 'PDF'
  });

  /**
   * Changes the selected report type and resets the form type.
   *
   * @param newType - The new report type to select
   */
  setType(newType: ReportType) {
    this.type.set(newType);
    this.form.update(f => ({ ...f, type: newType }));
  }

  /**
   * Updates partial values in the report form.
   *
   * @param partial - An object containing the fields to update
   */
  updateForm(partial: Partial<ReportConfig>) {
    this.form.update(f => ({ ...f, ...partial }));
  }
}
