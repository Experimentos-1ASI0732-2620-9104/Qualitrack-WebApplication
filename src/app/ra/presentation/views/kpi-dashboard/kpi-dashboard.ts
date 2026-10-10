import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RaStore } from '../../../application/ra.store';
import { ALL_ENVIRONMENTS, lastDays } from '../../../domain/model/indicator-period';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';

/** Lengths of the period offered, in days; the platform accepts up to 31. */
const PERIOD_DAYS = [1, 7, 31] as const;

/**
 * Indicators of the laboratory: average, minimum and maximum of the environmental readings of a period per device and
 * variable (US93), and the current counts of its records. Every value comes from persisted records; without readings
 * nothing is calculated.
 */
@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslateModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule,
    MatIconModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './kpi-dashboard.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', '../reporting-views.css'],
})
export class KpiDashboardComponent implements OnInit {
  protected readonly store = inject(RaStore);
  protected readonly environments = inject(EnvironmentStore);
  protected readonly periods = PERIOD_DAYS;
  protected readonly ALL_ENVIRONMENTS = ALL_ENVIRONMENTS;
  protected readonly days = signal<number>(7);
  protected readonly environmentId = signal<number | null>(null);

  /** Readings summarized per environment, in the order of the environments of the laboratory. */
  protected readonly groups = computed(() => {
    const summaries = this.store.dashboard()?.measurementSummaries ?? [];
    return this.environments.environments()
      .map((environment) => ({ environment, summaries: summaries.filter((item) => item.environmentId === environment.id) }))
      .filter((group) => group.summaries.length);
  });

  async ngOnInit(): Promise<void> {
    this.store.loadDevices();
    if (!this.environments.loaded()) await this.environments.loadEnvironments();
    this.reload();
  }

  protected changePeriod(days: number): void {
    this.days.set(days);
    this.reload();
  }

  protected changeEnvironment(environmentId: number): void {
    this.environmentId.set(environmentId === ALL_ENVIRONMENTS ? null : environmentId);
    this.reload();
  }

  protected reload(): void {
    this.store.loadDashboard(lastDays(this.days()), this.environmentId());
  }

  protected deviceLabel(deviceId: number): string {
    return this.store.deviceName(deviceId) ?? `#${deviceId}`;
  }
}
