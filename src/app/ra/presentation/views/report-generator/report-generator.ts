import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { RaStore } from '../../../application/ra.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchStore } from '../../../../batch/application/batch.store';
import { EquipmentStore } from '../../../../equipment/application/equipment.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { localIsoDate } from '../../../../shared/presentation/utils/local-date';
import { ALL_ENVIRONMENTS } from '../../../domain/model/indicator-period';

/**
 * Component responsible for providing a user interface to request operational reports.
 *
 * @remarks
 * In the presentation layer, this component acts as a command dispatcher for
 * document generation. It collects user parameters through template-driven forms
 * and sends command objects to {@link RaStore}, which coordinates the backend
 * request and file download.
 *
 * Supported report operations:
 * - Traceability report of a batch (US96)
 * - Environmental report of a period, of the laboratory or of one environment (US95)
 * - Inventory report of the laboratory or of one environment (US97)
 * - Maintenance and operation log of an equipment (US98)
 */
@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [BatchStore, EquipmentStore],
  templateUrl: './report-generator.html',
  styleUrl: './report-generator.css',
})
export class ReportGeneratorComponent implements OnInit {
  protected readonly batchStore = inject(BatchStore);
  protected readonly equipmentStore = inject(EquipmentStore);
  protected readonly environments = inject(EnvironmentStore);
  protected readonly ALL_ENVIRONMENTS = ALL_ENVIRONMENTS;

  /** Equipment located in an environment: its log report belongs to that environment (TS86). */
  protected readonly locatedEquipment = computed(() =>
    this.equipmentStore.equipmentList().filter(equipment => equipment.environmentId !== null));

  ngOnInit(): void {
    this.store.clearMessages();
    this.reloadBatches();
    this.reloadEquipment();
    if (!this.environments.loaded()) void this.environments.loadEnvironments();
  }

  protected reloadBatches(): void {
    this.batchForm.batchId = null;
    this.batchStore.loadBatches(this.currentLaboratoryId);
  }

  protected reloadEquipment(): void {
    this.equipmentForm.equipmentId = null;
    this.equipmentStore.loadEquipment(this.currentLaboratoryId);
  }

  protected get hasSelectedBatch(): boolean {
    return !this.batchStore.isLoading() && !this.batchStore.error() &&
      this.batchStore.batches().some(batch => batch.id === this.batchForm.batchId && batch.labId === this.currentLaboratoryId);
  }

  protected get hasSelectedEquipment(): boolean {
    return !this.equipmentStore.isLoading() && !this.equipmentStore.error() &&
      this.locatedEquipment().some(equipment => equipment.id === this.equipmentForm.equipmentId && equipment.labId === this.currentLaboratoryId);
  }
  /**
   * The application store managing the state for the Reporting and Analysis bounded context.
   */
  protected readonly store = inject(RaStore);

  /**
   * The identity and access management store used to retrieve the current session context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Form state for generating production batch reports.
   *
   * @remarks
   * `batchId` is numeric because the backend contract identifies batches by ID.
   */
  protected batchForm: {
    batchId: number | null;
    includeDeviations: boolean;
    format: 'PDF' | 'CSV';
  } = {
    batchId: null,
    includeDeviations: true,
    format: 'PDF',
  };

  /**
   * Form state for the environmental report: every environment ({@link ALL_ENVIRONMENTS}) or one, and whole calendar days.
   */
  protected complianceForm: {
    environmentId: number;
    startDate: Date | null;
    endDate: Date | null;
    format: 'PDF' | 'CSV';
  } = {
    environmentId: ALL_ENVIRONMENTS,
    startDate: null,
    endDate: null,
    format: 'PDF',
  };

  /**
   * Form state for the inventory report: every environment ({@link ALL_ENVIRONMENTS}) or one.
   */
  protected inventoryForm: { environmentId: number; format: 'PDF' | 'CSV' } = { environmentId: ALL_ENVIRONMENTS, format: 'PDF' };

  /**
   * Form state for exporting equipment maintenance and operational logs.
   *
   * @remarks
   * `equipmentId` is numeric because the backend contract identifies equipment by ID.
   */
  protected equipmentForm: {
    equipmentId: number | null;
    startDate: Date | null;
    endDate: Date | null;
    format: 'PDF' | 'CSV';
  } = {
    equipmentId: null,
    startDate: null,
    endDate: null,
    format: 'PDF',
  };

  /**
   * Retrieves the current laboratory ID from the active application context.
   *
   * @returns The numeric laboratory identifier used for compliance reports.
   *
   * @remarks
   * The laboratory identifier must come from the backend-verified onboarding context.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Dispatches the command to generate a production batch report.
   *
   * @remarks
   * The command includes the selected batch, requested sections, file format,
   * and requester identity.
   */
  protected onGenerateBatchReport(): void {
    if (!this.batchForm.batchId || !this.hasSelectedBatch || this.store.isLoading()) return;

    this.store.generateBatchReport({
      batchId: this.batchForm.batchId,
      includeDeviations: this.batchForm.includeDeviations,
      format: this.batchForm.format,
    });
  }

  /**
   * Dispatches the command to generate the environmental report of the selected calendar days (US95).
   *
   * @remarks
   * The days are sent in the browser time zone; {@link Date.toISOString} would move evening dates to the next day.
   */
  protected onGenerateComplianceReport(): void {
    if (!this.complianceForm.startDate || !this.complianceForm.endDate || this.store.isLoading()) return;

    this.store.generateComplianceReport({
      laboratoryId: this.currentLaboratoryId,
      environmentId: this.complianceForm.environmentId || null,
      startDate: localIsoDate(this.complianceForm.startDate),
      endDate: localIsoDate(this.complianceForm.endDate),
      format: this.complianceForm.format,
    });
  }

  /**
   * Dispatches the command to generate the inventory report (US97).
   */
  protected onGenerateInventoryReport(): void {
    if (this.store.isLoading()) return;
    this.store.generateInventoryReport({
      laboratoryId: this.currentLaboratoryId,
      environmentId: this.inventoryForm.environmentId || null,
      format: this.inventoryForm.format,
    });
  }

  /**
   * Dispatches the command to export historical logs for a specific equipment.
   *
   * @remarks
   * The command includes the equipment identifier, requested date range,
   * output format, and requester identity.
   */
  protected onExportEquipmentLog(): void {
    if (
      !this.equipmentForm.equipmentId || !this.hasSelectedEquipment || this.store.isLoading() ||
      !this.equipmentForm.startDate ||
      !this.equipmentForm.endDate
    ) {
      return;
    }

    const equipment = this.locatedEquipment().find(item => item.id === this.equipmentForm.equipmentId);
    if (!equipment?.environmentId) return;

    this.store.exportEquipmentLog({
      laboratoryId: this.currentLaboratoryId,
      environmentId: equipment.environmentId,
      equipmentId: this.equipmentForm.equipmentId,
      startDate: localIsoDate(this.equipmentForm.startDate),
      endDate: localIsoDate(this.equipmentForm.endDate),
      format: this.equipmentForm.format,
    });
  }
}
