import { Component, OnInit, inject } from '@angular/core';
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
 * - Production batch report generation
 * - Regulatory compliance report generation
 * - Equipment log export
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

  ngOnInit(): void {
    this.store.clearMessages();
    this.reloadBatches();
    this.reloadEquipment();
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
      this.equipmentStore.equipmentList().some(equipment => equipment.id === this.equipmentForm.equipmentId && equipment.labId === this.currentLaboratoryId);
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
    includeTelemetry: boolean;
    includeDeviations: boolean;
    format: 'PDF' | 'CSV';
  } = {
    batchId: null,
    includeTelemetry: false,
    includeDeviations: true,
    format: 'PDF',
  };

  /**
   * Form state for generating regulatory compliance reports.
   */
  protected complianceForm: {
    startDate: Date | null;
    endDate: Date | null;
    format: 'PDF' | 'CSV';
  } = {
    startDate: null,
    endDate: null,
    format: 'PDF',
  };

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
   * Retrieves the current user ID from the active session context.
   *
   * @returns The numeric user identifier used as the report requester.
   *
   * @remarks
   * This value identifies the authenticated user who requests the report.
   */
  private get currentUserId(): number {
    return this.iamStore.requireUserId();
  }

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
      includeTelemetry: this.batchForm.includeTelemetry,
      includeDeviations: this.batchForm.includeDeviations,
      format: this.batchForm.format,
      requestedBy: this.currentUserId,
    });
  }

  /**
   * Dispatches the command to generate a regulatory compliance report.
   *
   * @remarks
   * The command uses `laboratoryId`, matching the domain model and backend API contract.
   */
  protected onGenerateComplianceReport(): void {
    if (!this.complianceForm.startDate || !this.complianceForm.endDate) return;

    this.store.generateComplianceReport({
      laboratoryId: this.currentLaboratoryId,
      startDate: this.complianceForm.startDate.toISOString(),
      endDate: this.complianceForm.endDate.toISOString(),
      format: this.complianceForm.format,
      requestedBy: this.currentUserId,
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

    this.store.exportEquipmentLog({
      equipmentId: this.equipmentForm.equipmentId,
      startDate: this.equipmentForm.startDate.toISOString(),
      endDate: this.equipmentForm.endDate.toISOString(),
      format: this.equipmentForm.format,
      requestedBy: this.currentUserId,
    });
  }
}
