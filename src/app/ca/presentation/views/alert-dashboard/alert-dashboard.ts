import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CaStore } from '../../../application/ca.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';
import { AlertTable } from '../../components/alert-table/alert-table';

/**
 * Active alerts of an environment and its monitored containers (US85): open alerts, unresolved or being attended,
 * with their origin and severity.
 */
@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatButtonModule, MatIconModule, EnvironmentSelector, AlertTable],
  templateUrl: './alert-dashboard.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class AlertDashboard implements OnInit {
  /** Store that holds the alerts shown by the table. */
  protected readonly store = inject(CaStore);
  /** Store of the environments the person can choose from. */
  protected readonly environments = inject(EnvironmentStore);
  /** Environment whose alerts are shown; `null` until one is chosen. */
  protected readonly environmentId = signal<number | null>(null);

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
   * Shows the alerts of another environment and remembers it as the one the person prefers.
   *
   * @param environmentId - The environment chosen
   */
  protected changeEnvironment(environmentId: number): void {
    this.environments.rememberEnvironment(environmentId, 'tracking');
    this.environmentId.set(environmentId);
    this.refresh();
  }

  /** Loads the open alerts of the chosen environment again; does nothing if none is chosen. */
  protected refresh(): void {
    const environmentId = this.environmentId();
    if (environmentId !== null) this.store.loadEnvironmentAlerts(environmentId, { active: true });
  }
}
