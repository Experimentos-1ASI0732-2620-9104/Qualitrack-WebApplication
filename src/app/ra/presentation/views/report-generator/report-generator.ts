import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';

import { ReportGeneratorState } from './report-generator.state';
import { reportConfigFromQuery } from './report-generator-query';
import { RaStore } from '../../../application/ra.store';
import { ErrorBanner } from '../../../../shared/presentation/components/error-banner/error-banner';
import { ReportTypeSelector } from '../../components/report-type-selector/report-type-selector';
import { ReportParamsForm } from '../../components/report-params-form/report-params-form';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { REPORTS_TABS } from '../../reports-tabs';

/**
 * Orchestrator component for the Report Generator view.
 *
 * @remarks
 * This component acts as a layout wrapper and state provider for the two main sections
 * of the report generator: the type selector and the parameters form.
 * It initializes the necessary domain data (batches, equipment, environments)
 * and handles the global loading and error states. Another view can prepare the form through the address, as the
 * alert history does with `?type=compliance&environmentId=…&from=…&to=…`.
 */
@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    PageHeader,
    CommonModule,
    TranslatePipe,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    ReportTypeSelector,
    ReportParamsForm,
    ErrorBanner
  ],
  providers: [ReportGeneratorState],
  templateUrl: './report-generator.html',
  styleUrl: './report-generator.css'
})
export class ReportGeneratorComponent implements OnInit, OnDestroy {
  /** Operations of the reports module. */
  protected readonly tabs = REPORTS_TABS;

  /** The application store managing the Reporting and Analysis state. */
  protected store = inject(RaStore);

  /** The form of the report, which the address can prepare. */
  private readonly state = inject(ReportGeneratorState);

  /** The route of the view, which carries the values prepared by another view. */
  private readonly route = inject(ActivatedRoute);

  /** Initializes the component by loading the required reference data and the values of the address. */
  ngOnInit() {
    const prepared = reportConfigFromQuery(this.route.snapshot.queryParamMap);
    if (prepared.type) this.state.setType(prepared.type);
    this.state.updateForm(prepared);
    this.store.clearMessages();
    this.store.clearReportPreview();
    this.store.loadBatches();
    this.store.loadEquipment();
    void this.store.loadEnvironments();
  }

  /** Forgets the previewed report, so a later visit generates the report again with the current data. */
  ngOnDestroy() {
    this.store.clearReportPreview();
  }
}
