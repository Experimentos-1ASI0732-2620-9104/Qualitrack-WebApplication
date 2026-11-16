import { Component, OnInit, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TrackingStore } from '../../../application/tracking.store';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { ThresholdEditor } from '../../components/threshold-editor/threshold-editor';
import { ActuationRulesEditor } from '../../components/actuation-rules-editor/actuation-rules-editor';
import { configurableMetricsOf, MonitoredMetric } from '../../../domain/model/monitored-metric';
import {
  ActuationRule,
  EnvironmentalProfile,
  EnvironmentalThreshold,
  ThresholdInput,
} from '../../../domain/model/environmental-profile.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { SetupNotice } from '../../../../shared/presentation/components/setup-notice/setup-notice';
import { IamStore } from '../../../../iam/application/iam.store';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { TRACKING_TABS } from '../../tracking-tabs';

/**
 * Represents stable empty collections used as default values.
 *
 * These constants prevent unnecessary object recreation during Angular
 * change detection cycles.
 *
 * Reusing the same references avoids resetting child editors while users
 * are actively modifying configuration values.
 */
const NO_THRESHOLDS: EnvironmentalThreshold[] = [];
const NO_RULES: ActuationRule[] = [];
const NO_METRICS: MonitoredMetric[] = [];

/**
 * Component responsible for managing environmental profile configuration.
 *
 * This view allows quality managers to configure and review:
 * - Environmental device thresholds.
 * - Container monitor thresholds.
 * - Automatic actuation rules.
 *
 * The component coordinates profile information between the TrackingStore
 * and specialized configuration editors.
 *
 * Editing capabilities depend on user permissions, while other roles
 * can access the configured profiles in read-only mode.
 *
 * Environmental profiles define the rules used by IoT devices to evaluate
 * measurements and execute automatic responses.
 */
@Component({
  selector: 'app-environmental-profiles',
  standalone: true,
  imports: [
    PageHeader,
    ListToolbar,
    SetupNotice,
    DateTimePipe,
    RouterLink,
    TranslatePipe,
    MatIconModule,
    MatProgressSpinnerModule,
    EnvironmentSelector,
    ThresholdEditor,
    ActuationRulesEditor,
  ],
  templateUrl: './environmental-profiles.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './environmental-profiles.css',
})
export class EnvironmentalProfiles implements OnInit {
  /** Operations of the tracking module. */
  protected readonly tabs = TRACKING_TABS;

  /** Reads the profiles of the environment again. */
  protected reload(): void {
    void this.store.loadProfiles();
  }

  /**
   * Application store responsible for environmental profiles,
   * thresholds and actuation rule state management.
   */
  protected readonly store = inject(TrackingStore);
  protected readonly iam = inject(IamStore);

  /**
   * Metrics configurable for environmental devices.
   *
   * These metrics allow quality managers to define
   * environmental thresholds.
   */
  protected readonly environmentMetrics = configurableMetricsOf('ENVIRONMENTAL_DEVICE');

  /**
   * Metrics configurable for container monitoring devices.
   *
   * These metrics are used to define container environmental limits.
   */
  protected readonly containerMetrics = configurableMetricsOf('CONTAINER_MONITOR');

  /**
   * Computed mapping between container devices and their configured metrics.
   *
   * Only metrics with saved thresholds are exposed because actuation rules
   * can only be created using metrics with active configuration.
   */
  private readonly configuredMetricsByDevice = computed(() => {
    const metrics = new Map<number, MonitoredMetric[]>();
    this.store.containerProfiles().forEach((profile, deviceId) =>
      metrics.set(
        deviceId,
        profile.thresholds.map((threshold) => threshold.metric),
      ),
    );
    return metrics;
  });

  /**
   * Initializes the environmental profiles view.
   *
   * Loads available environments when required and restores
   * the previously selected environment.
   *
   * After selecting an environment, the component loads
   * its active environmental profiles.
   */
  async ngOnInit(): Promise<void> {
    await this.store.loadEnvironments();
    const current =
      this.store.environmentId() ??
      this.store.preferredEnvironmentId() ??
      null;
    if (current !== null) await this.changeEnvironment(current);
  }

  /**
   * Changes the active environment and loads its profiles.
   *
   * Execution flow:
   * 1. Stores the user's environment preference.
   * 2. Updates selected environment data when required.
   * 3. Clears previous messages.
   * 4. Retrieves environmental and container profiles.
   *
   * @param environmentId Identifier of the selected environment.
   */
  protected async changeEnvironment(environmentId: number): Promise<void> {
    this.store.rememberEnvironment(environmentId);
    if (this.store.environmentId() !== environmentId || !this.store.devices().length) {
      await this.store.selectEnvironment(environmentId);
    }
    this.store.clearMessages();
    await this.store.loadProfiles();
  }

  /**
   * Retrieves the environmental profile associated with a container monitor.
   *
   * @param deviceId Container monitor identifier.
   * @returns Environmental profile when configured.
   */
  protected containerProfile(deviceId: number): EnvironmentalProfile | null {
    return this.store.containerProfiles().get(deviceId) ?? null;
  }

  /**
   * Retrieves the metrics available for actuation rule configuration.
   *
   * Only metrics with previously saved thresholds can be used
   * as rule conditions.
   *
   * @param deviceId Container monitor identifier.
   * @returns Configured metrics available for automation rules.
   */
  protected configuredMetrics(deviceId: number): MonitoredMetric[] {
    return this.configuredMetricsByDevice().get(deviceId) ?? NO_METRICS;
  }

  /**
   * Retrieves threshold configuration from an environmental profile.
   *
   * @param profile Environmental profile.
   * @returns Configured thresholds or an empty collection.
   */
  protected thresholdsOf(profile: EnvironmentalProfile | null): EnvironmentalThreshold[] {
    return profile?.thresholds ?? NO_THRESHOLDS;
  }

  /**
   * Retrieves actuation rules from an environmental profile.
   *
   * @param profile Environmental profile.
   * @returns Configured rules or an empty collection.
   */
  protected rulesOf(profile: EnvironmentalProfile | null): ActuationRule[] {
    return profile?.actuationRules ?? NO_RULES;
  }

  /**
   * Saves threshold configuration for the environment device.
   *
   * The null device identifier represents the general environmental profile.
   *
   * @param thresholds Threshold configuration values.
   */
  protected saveEnvironment(thresholds: ThresholdInput[]): void {
    void this.store.saveThresholds(null, thresholds);
  }

  /**
   * Saves threshold configuration for a container monitor.
   *
   * @param deviceId Container monitor identifier.
   * @param thresholds Threshold configuration values.
   */
  protected saveContainer(deviceId: number, thresholds: ThresholdInput[]): void {
    void this.store.saveThresholds(deviceId, thresholds);
  }

  /**
   * Saves automatic actuation rules for a container monitor.
   *
   * @param deviceId Container monitor identifier.
   * @param rules Actuation rules configuration.
   */
  protected saveRules(deviceId: number, rules: ActuationRule[]): void {
    void this.store.saveActuationRules(deviceId, rules);
  }
}
