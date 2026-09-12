import { Component, OnInit, effect, untracked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { TrackingStore } from '../../../application/tracking.store';
import { EquipmentStore } from '../../../../equipment/application/equipment.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Component responsible for displaying historical telemetry data in a tabular format.
 *
 * @remarks
 * In the presentation layer, this component provides a detailed data grid view of
 * equipment sensor readings over time. It allows users to filter time-series data
 * by equipment and date range, while highlighting measurements marked as anomalies.
 */
@Component({
  selector: 'app-telemetry-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './telemetry-history.html',
  styleUrl: './telemetry-history.css',
})
export class TelemetryHistoryComponent implements OnInit {
  /**
   * Store that manages Tracking bounded context state.
   */
  protected readonly store = inject(TrackingStore);

  /**
   * Store that manages Equipment bounded context state.
   */
  protected readonly equipmentStore = inject(EquipmentStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Columns displayed in the telemetry history table.
   */
  protected readonly displayedColumns = ['timestamp', 'parameterName', 'recordedValue', 'status'];

  /**
   * Current filter state used to query telemetry history.
   *
   * @remarks
   * Equipment identifiers are numeric to stay aligned with the backend API and
   * the domain model. Date values are converted to ISO strings before querying.
   */
  protected filters = {
    equipmentId: null as number | null,
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  };

  /**
   * Selects the first recorded equipment after loading completes.
   */
  constructor() {
    effect(() => {
      const first = this.equipmentStore.equipmentList()[0];
      if (this.equipmentStore.isLoading() || this.equipmentStore.error() || !first) return;
      untracked(() => {
        if (this.filters.equipmentId) return;
        this.filters.equipmentId = first.id;
        this.loadHistoryData();
      });
    });
  }

  /**
   * Retrieves the current laboratory ID based on the authenticated context.
   *
   * @remarks
   * The value is converted to number to keep consistency with the backend API.
   */
  private get currentLabId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Lifecycle hook that loads available equipment and initializes history data.
   *
   * @remarks
   * Once the equipment list is available, the first equipment is selected
   * automatically and its telemetry history is loaded.
   */
  ngOnInit(): void {
    this.equipmentStore.loadEquipment(this.currentLabId);
  }


  /**
   * Constructs the query payload from the current filters and loads telemetry history.
   */
  protected loadHistoryData(): void {
    if (!this.filters.equipmentId) return;

    const query: { equipmentId: number; from?: string; to?: string } = {
      equipmentId: this.filters.equipmentId,
    };

    if (this.filters.dateFrom) {
      query.from = this.filters.dateFrom.toISOString();
    }

    if (this.filters.dateTo) {
      query.to = this.filters.dateTo.toISOString();
    }

    this.store.loadTelemetryHistory(query);
  }

  /**
   * Clears the selected date range and reloads history for the selected equipment.
   */
  protected clearFilters(): void {
    this.filters.dateFrom = null;
    this.filters.dateTo = null;
    this.loadHistoryData();
  }

}
