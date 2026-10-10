import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TrackingStore, DeviceSnapshot } from '../../../application/tracking.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';
import { MonitoredMetric } from '../../../domain/model/monitored-metric';
import { Measurement } from '../../../domain/model/measurement.entity';

/**
 * Component responsible for displaying the current environmental monitoring status.
 *
 * This view provides a real-time overview of IoT devices within a selected environment,
 * including:
 * - Air quality and motion information from environmental devices.
 * - Temperature, humidity, luminosity and RFID information from container monitors.
 * - Latest device actions and connectivity information.
 *
 * The component coordinates environment selection and delegates
 * telemetry state management to the TrackingStore.
 *
 * It provides the main user interface for monitoring current environmental
 * conditions according to the configured IoT devices.
 *//**
 * Component responsible for displaying the current environmental monitoring status.
 *
 * This view provides a real-time overview of IoT devices within a selected environment,
 * including:
 * - Air quality and motion information from environmental devices.
 * - Temperature, humidity, luminosity and RFID information from container monitors.
 * - Latest device actions and connectivity information.
 *
 * The component coordinates environment selection and delegates
 * telemetry state management to the TrackingStore.
 *
 * It provides the main user interface for monitoring current environmental
 * conditions according to the configured IoT devices.
 */
@Component({
  selector: 'app-environmental-monitoring',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EnvironmentSelector,
  ],
  templateUrl: './environmental-monitoring.html',
  styleUrls: [
    '../../../../shared/presentation/styles/operations-page.css',
    '../tracking-views.css',
  ],
})
export class EnvironmentalMonitoring implements OnInit {

  /**
   * Central application store responsible for IoT telemetry state,
   * device snapshots and environmental monitoring information.
   */
  protected readonly store = inject(TrackingStore);

  /**
   * Store responsible for managing laboratory environments
   * and user environment preferences.
   */
  protected readonly environments = inject(EnvironmentStore);

  /**
   * Metrics displayed for container monitoring devices.
   *
   * These metrics represent the main environmental conditions
   * required for container status visualization.
   */
  protected readonly containerMetrics: MonitoredMetric[] = [
    'TEMPERATURE',
    'HUMIDITY',
    'LUMINOSITY',
  ];

  /**
   * Initializes the monitoring view.
   *
   * Loads available environments when necessary and restores
   * the preferred environment selected by the user.
   *
   * After selecting an environment, the component retrieves
   * the latest device snapshots for monitoring purposes.
   */
  async ngOnInit(): Promise<void> {
    if (!this.environments.loaded()) await this.environments.loadEnvironments();
    const current =
      this.store.environmentId() ??
      this.environments.preferredEnvironment(undefined, 'tracking')?.id ??
      null;
    if (current !== null) await this.changeEnvironment(current);
  }

  /**
   * Changes the active environment displayed by the monitoring view.
   *
   * Execution flow:
   * 1. Stores the selected environment preference.
   * 2. Updates the TrackingStore environment context.
   * 3. Loads the latest IoT device snapshots.
   *
   * @param environmentId Identifier of the selected environment.
   */
  protected async changeEnvironment(environmentId: number): Promise<void> {
    this.environments.rememberEnvironment(environmentId, 'tracking');
    await this.store.selectEnvironment(environmentId);
    await this.store.loadSnapshots();
  }

  /**
   * Refreshes the current monitoring information.
   *
   * Requests updated device snapshots to display
   * the latest available IoT telemetry data.
   */
  protected refresh(): void {
    void this.store.loadSnapshots();
  }

  /**
   * Retrieves the current snapshot associated with a device.
   *
   * Device snapshots contain the latest readings, actions
   * and connectivity information used by the monitoring view.
   *
   * @param deviceId Identifier of the IoT device.
   * @returns Device snapshot when available.
   */
  protected snapshotOf(deviceId: number): DeviceSnapshot | undefined {
    return this.store.snapshots().find((snapshot) => snapshot.device.id === deviceId);
  }

  /**
   * Retrieves the latest measurement of a specific metric
   * from a device snapshot.
   *
   * @param snapshot Current device snapshot.
   * @param metric Environmental metric to retrieve.
   * @returns Latest measurement when available.
   */
  protected reading(
    snapshot: DeviceSnapshot | undefined,
    metric: MonitoredMetric,
  ): Measurement | undefined {
    return snapshot?.readings.get(metric);
  }
}
