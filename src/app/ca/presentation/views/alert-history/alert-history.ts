import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { CaStore } from '../../../application/ca.store';
import { AlertSeverity, AlertStatus } from '../../../domain/model/deviation-alert.entity';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';
import { AlertTable } from '../../components/alert-table/alert-table';

/**
 * Every alert of an environment, including resolved ones, filtered by status and severity on the server (TS74).
 */
@Component({
  selector: 'app-alert-history',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, MatButtonModule, MatFormFieldModule, MatIconModule,
    MatSelectModule, EnvironmentSelector, AlertTable],
  templateUrl: './alert-history.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class AlertHistory implements OnInit {
  /** Store that holds the alerts shown by the table. */
  protected readonly store = inject(CaStore);
  /** Store of the environments the person can choose from. */
  protected readonly environments = inject(EnvironmentStore);
  /** Environment whose alerts are shown; `null` until one is chosen. */
  protected readonly environmentId = signal<number | null>(null);
  /** Statuses the person can filter by. */
  protected readonly statuses: AlertStatus[] = ['UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED'];
  /** Severities the person can filter by. */
  protected readonly severities: AlertSeverity[] = ['LOW', 'WARNING', 'CRITICAL'];
  /** Status chosen in the filter; an empty string means any status. */
  protected status: AlertStatus | '' = '';
  /** Severity chosen in the filter; an empty string means any severity. */
  protected severity: AlertSeverity | '' = '';

  /**
   * Clears the previous alerts and errors, loads the devices, and shows the alerts of the preferred environment.
   *
   * @remarks
   * Waits for the environments to load when they are not loaded yet. If there is no preferred environment,
   * nothing is loaded.
   */
  async ngOnInit(): Promise<void> {
    this.store.clearError();
    this.store.clearAlerts();
    this.store.loadDevices();
    if (!this.environments.loaded()) await this.environments.loadEnvironments();
    const preferred = this.environments.preferredEnvironment(undefined, 'tracking');
    if (preferred) this.changeEnvironment(preferred.id);
  }

  /**
   * Searches the alerts of another environment and remembers it as the one the person prefers.
   *
   * @param environmentId - The environment chosen
   */
  protected changeEnvironment(environmentId: number): void {
    this.environments.rememberEnvironment(environmentId, 'tracking');
    this.environmentId.set(environmentId);
    this.search();
  }

  /**
   * Loads the alerts of the chosen environment with the status and severity of the filter.
   *
   * @remarks
   * The filtering is done by the server. Does nothing if no environment is chosen.
   */
  protected search(): void {
    const environmentId = this.environmentId();
    if (environmentId === null) return;
    this.store.loadEnvironmentAlerts(environmentId, {
      status: this.status || undefined,
      severity: this.severity || undefined,
    });
  }

  /** Removes the status and severity filters and searches again. */
  protected clearFilters(): void {
    this.status = '';
    this.severity = '';
    this.search();
  }
}
