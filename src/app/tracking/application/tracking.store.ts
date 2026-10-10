import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TrackingApi } from '../infrastructure/tracking-api';
import { DeviceTarget, TelemetryPeriod } from '../infrastructure/tracking-api-endpoints';
import { Measurement, latestByMetric } from '../domain/model/measurement.entity';
import { ActuationEvent } from '../domain/model/actuation-event.entity';
import { DeviceConnection } from '../domain/model/device-connection.entity';
import { ActuationRule, EnvironmentalProfile, ThresholdInput } from '../domain/model/environmental-profile.entity';
import { MonitoredMetric } from '../domain/model/monitored-metric';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../equipment/domain/model/equipment.entity';
import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';

/**
 * Represents the current state snapshot of an IoT device within an environment.
 *
 * This model aggregates the latest available information from the device:
 * - Latest readings grouped by monitored metric.
 * - Most recent motion detection event.
 * - Latest actuation event executed.
 * - Current device connection status.
 *
 * It provides a consolidated view of the device operational state
 * without requiring multiple independent data requests from the UI layer.
 */

export interface DeviceSnapshot {
  device: Equipment;
  readings: Map<MonitoredMetric, Measurement>;
  /** Latest reading of MOTION with a detection (value 1) in the period. */
  lastMotion: Measurement | null;
  lastAction: ActuationEvent | null;
  connection: DeviceConnection | null;
  failed: boolean;
}

/**
 * Represents the historical telemetry information of an IoT device
 * during a specific time period.
 *
 * Contains:
 * - Historical measurements collected from the device.
 * - Actuation events triggered during the selected period.
 * - Environmental configuration associated with the device.
 *
 * This structure is used to provide historical analysis and monitoring capabilities.
 */
export interface DeviceHistory {
  device: Equipment;
  period: TelemetryPeriod;
  measurements: Measurement[];
  actuationEvents: ActuationEvent[];
  profile: EnvironmentalProfile | null;
}

/** Period of the current conditions: a reading older than this is not current. */
const RECENT_PERIOD_HOURS = 24;

/**
 * Main state management store for the Tracking & Telemetry module.
 *
 * Responsible for managing the reactive state related to:
 * - IoT devices registered within an environment.
 * - Current device conditions and telemetry snapshots.
 * - Historical measurements and actuation events.
 * - Environmental profiles and automation rules.
 *
 * This store acts as an application layer coordinator between
 * presentation components and infrastructure services.
 *
 * It uses Angular Signals to provide reactive state updates
 * while keeping business-related state management centralized.
 */
@Injectable({ providedIn: 'root' })
export class TrackingStore {
  private readonly api = inject(TrackingApi);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly iam = inject(IamStore);

  private readonly _environmentId = signal<number | null>(null);
  private readonly _devices = signal<Equipment[]>([]);
  private readonly _snapshots = signal<DeviceSnapshot[]>([]);
  private readonly _history = signal<DeviceHistory | null>(null);
  private readonly _environmentProfile = signal<EnvironmentalProfile | null>(null);
  private readonly _containerProfiles = signal<Map<number, EnvironmentalProfile>>(new Map());
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _notice = signal<string | null>(null);
  private generation = 0;

  readonly environmentId = this._environmentId.asReadonly();
  readonly devices = this._devices.asReadonly();
  readonly snapshots = this._snapshots.asReadonly();
  readonly history = this._history.asReadonly();
  readonly environmentProfile = this._environmentProfile.asReadonly();
  readonly containerProfiles = this._containerProfiles.asReadonly();
  readonly isLoading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly notice = this._notice.asReadonly();

  /**
   * Determines whether the current user has permission to configure
   * environmental profiles and device rules.
   *
   * Configuration capabilities are restricted to authorized quality
   * management roles, while other users can only consult the information.
   */
  readonly canConfigure = this.iam.canManageQuality;

  readonly environmentalDevice = computed(
    () => this._devices().find((device) => device.deviceType === 'ENVIRONMENTAL_DEVICE') ?? null,
  );

  readonly containerMonitors = computed(() =>
    this._devices().filter((device) => device.deviceType === 'CONTAINER_MONITOR'),
  );

  /**
   * Selects an environment and retrieves its associated IoT devices.
   *
   * Execution flow:
   * 1. Updates the selected environment identifier.
   * 2. Clears previous environment-related state.
   * 3. Retrieves available equipment from the laboratory.
   * 4. Filters only IoT-enabled devices belonging to the selected environment.
   *
   * The generation counter prevents outdated asynchronous responses
   * from overwriting the latest application state.
   */
  async selectEnvironment(environmentId: number): Promise<void> {
    const generation = ++this.generation;
    this._environmentId.set(environmentId);
    this._devices.set([]);
    this._snapshots.set([]);
    this._history.set(null);
    this._environmentProfile.set(null);
    this._containerProfiles.set(new Map());
    this.clearMessages();
    this._loading.set(true);
    try {
      const laboratoryId = this.iam.requireLaboratoryId();
      const equipment = await firstValueFrom(this.equipmentApi.getEquipment(laboratoryId));
      if (generation !== this.generation) return;
      this._devices.set(
        equipment.filter(
          (item) =>
            item.isIotDevice && item.labId === laboratoryId && item.environmentId === environmentId,
        ),
      );
    } catch {
      if (generation === this.generation) this._error.set('tracking.errors.load');
    } finally {
      if (generation === this.generation) this._loading.set(false);
    }
  }

  /**
   * Loads the current status snapshot of every IoT device
   * registered in the selected environment.
   *
   * For each device, the operation retrieves:
   * - Recent telemetry measurements.
   * - Latest actuation events.
   * - Device connectivity status.
   *
   * The collected information is transformed into DeviceSnapshot
   * objects to provide a summarized monitoring view.
   */
  async loadSnapshots(): Promise<void> {
    const environmentId = this._environmentId();
    if (environmentId === null) return;
    const generation = this.generation;
    this._loading.set(true);
    const period = recentPeriod();
    const snapshots = await Promise.all(
      this._devices().map((device) => this.snapshot(device, environmentId, period)),
    );
    if (generation !== this.generation) return;
    this._snapshots.set(snapshots);
    this._loading.set(false);
  }

  /**
   * Retrieves historical telemetry information for a specific device.
   *
   * Allows filtering historical data by:
   * - Selected time period.
   * - Specific monitored metric.
   *
   * The operation loads measurements, actuation events,
   * and the environmental profile associated with the device.
   *
   * This information supports historical analysis and device monitoring.
   */
  async loadHistory(
    device: Equipment,
    period: TelemetryPeriod,
    metric: MonitoredMetric | null,
  ): Promise<void> {
    const environmentId = this._environmentId();
    if (environmentId === null) return;
    const generation = this.generation;
    const target = this.target(device, environmentId);
    this.clearMessages();
    this._loading.set(true);
    try {
      const [measurements, actuationEvents, profile] = await Promise.all([
        firstValueFrom(this.api.getMeasurements(target, period, metric)),
        device.deviceType === 'CONTAINER_MONITOR'
          ? firstValueFrom(this.api.getActuationEvents(target, period))
          : [],
        this.optionalProfile(target),
      ]);
      if (generation !== this.generation) return;
      this._history.set({ device, period, measurements, actuationEvents, profile });
    } catch (error) {
      if (generation === this.generation) {
        this._history.set(null);
        this._error.set(
          error instanceof ApiError && error.status === 400
            ? 'tracking.errors.period'
            : 'tracking.errors.load',
        );
      }
    } finally {
      if (generation === this.generation) this._loading.set(false);
    }
  }

  /**
   * Loads environmental profiles configured for the selected environment
   * and its container monitoring devices.
   *
   * Retrieves:
   * - General environmental thresholds.
   * - Container-specific monitoring configurations.
   *
   * The information is used to display current configuration
   * and support profile management operations.
   */
  async loadProfiles(): Promise<void> {
    const environmentId = this._environmentId();
    if (environmentId === null) return;
    const generation = this.generation;
    this._loading.set(true);
    try {
      const laboratoryId = this.iam.requireLaboratoryId();
      const environmentProfile = this.environmentalDevice()
        ? await this.optionalProfile({ laboratoryId, environmentId, deviceId: null })
        : null;
      const containerProfiles = new Map<number, EnvironmentalProfile>();
      for (const monitor of this.containerMonitors()) {
        const profile = await this.optionalProfile({
          laboratoryId,
          environmentId,
          deviceId: monitor.id,
        });
        if (profile) containerProfiles.set(monitor.id, profile);
      }
      if (generation !== this.generation) return;
      this._environmentProfile.set(environmentProfile);
      this._containerProfiles.set(containerProfiles);
    } catch {
      if (generation === this.generation) this._error.set('tracking.errors.load');
    } finally {
      if (generation === this.generation) this._loading.set(false);
    }
  }

  /**
   * Updates environmental threshold configurations for a device.
   *
   * Thresholds define acceptable environmental ranges used
   * to evaluate monitoring conditions and detect abnormal values.
   *
   * @returns true when the platform successfully stores the configuration;
   * false otherwise.
   */
  async saveThresholds(deviceId: number | null, thresholds: ThresholdInput[]): Promise<boolean> {
    return this.saveProfile(
      deviceId,
      (target) => this.api.updateThresholds(target, thresholds),
      'tracking.profiles.thresholds-saved',
    );
  }

  /**
   * Updates automatic actuation rules for a container monitoring device.
   *
   * Actuation rules define automated behaviors that are executed
   * when specific environmental conditions are detected.
   *
   * These rules allow IoT devices to respond automatically
   * according to configured business conditions.
   */
  async saveActuationRules(deviceId: number, rules: ActuationRule[]): Promise<boolean> {
    return this.saveProfile(
      deviceId,
      (target) => this.api.updateActuationRules(target, rules),
      'tracking.profiles.rules-saved',
    );
  }

  clearMessages(): void {
    this._error.set(null);
    this._notice.set(null);
  }

  /**
   * Internal helper method responsible for persisting environmental profiles.
   *
   * Handles:
   * - API communication.
   * - Saving state updates.
   * - Success notifications.
   * - Error management.
   *
   * This method centralizes common persistence behavior
   * shared by threshold and actuation rule operations.
   */
  private async saveProfile(
    deviceId: number | null,
    request: (target: DeviceTarget) => ReturnType<TrackingApi['updateThresholds']>,
    notice: string,
  ): Promise<boolean> {
    const environmentId = this._environmentId();
    if (environmentId === null || this._saving()) return false;
    this.clearMessages();
    this._saving.set(true);
    try {
      const profile = await firstValueFrom(
        request({ laboratoryId: this.iam.requireLaboratoryId(), environmentId, deviceId }),
      );
      if (deviceId === null) this._environmentProfile.set(profile);
      else this._containerProfiles.update((profiles) => new Map(profiles).set(deviceId, profile));
      this._notice.set(notice);
      return true;
    } catch (error) {
      this._error.set(
        error instanceof ApiError && error.status === 400 && error.details
          ? error.details
          : 'tracking.errors.save',
      );
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  /**
   * Creates a consolidated snapshot of the current IoT device state.
   *
   * Executes independent data retrieval operations concurrently
   * to improve response time.
   *
   * If any request fails, the method returns a failed snapshot
   * allowing the presentation layer to handle unavailable devices
   * without breaking the monitoring process.
   */
  private async snapshot(
    device: Equipment,
    environmentId: number,
    period: TelemetryPeriod,
  ): Promise<DeviceSnapshot> {
    const laboratoryId = this.iam.requireLaboratoryId();
    const target = this.target(device, environmentId);
    try {
      const [measurements, actuationEvents, connection] = await Promise.all([
        firstValueFrom(this.api.getMeasurements(target, period)),
        device.deviceType === 'CONTAINER_MONITOR'
          ? firstValueFrom(this.api.getActuationEvents(target, period))
          : [],
        firstValueFrom(this.api.getDeviceConnection(laboratoryId, environmentId, device.id)),
      ]);
      const detections = measurements.filter(
        (reading) => reading.metric === 'MOTION' && reading.value === 1,
      );
      return {
        device,
        readings: latestByMetric(measurements),
        lastMotion: detections.at(-1) ?? null,
        lastAction: actuationEvents.at(-1) ?? null,
        connection,
        failed: false,
      };
    } catch {
      return {
        device,
        readings: new Map(),
        lastMotion: null,
        lastAction: null,
        connection: null,
        failed: true,
      };
    }
  }

  /**
   * Retrieves the environmental profile associated with a target device.
   *
   * Returns null when the device does not have a configured profile.
   */
  private optionalProfile(target: DeviceTarget): Promise<EnvironmentalProfile | null> {
    return firstValueFrom(this.api.getProfile(target));
  }

  /**
   * Creates the API target identifier required to communicate
   * with the tracking infrastructure.
   *
   * The target contains the laboratory, environment,
   * and optional device identifier depending on the device type.
   */
  private target(device: Equipment, environmentId: number): DeviceTarget {
    return {
      laboratoryId: this.iam.requireLaboratoryId(),
      environmentId,
      deviceId: device.deviceType === 'CONTAINER_MONITOR' ? device.id : null,
    };
  }
}

/**
 * Generates the default telemetry query period.
 *
 * The period represents the last 24 hours from the current time
 * and is used to retrieve recent device measurements and events.
 */
export function recentPeriod(): TelemetryPeriod {
  const to = new Date();
  const from = new Date(to.getTime() - RECENT_PERIOD_HOURS * 3600_000);
  return { from: from.toISOString(), to: to.toISOString() };
}
