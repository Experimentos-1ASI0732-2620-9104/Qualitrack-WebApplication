import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { EquipmentApi } from '../infrastructure/equipment-api';
import { Equipment } from '../domain/model/equipment.entity';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { RegisterEquipmentCommand } from '../domain/model/register-equipment.command';
import { RegisterIotDeviceCommand } from '../domain/model/register-iot-device.command';
import { ChangeEquipmentStatusCommand } from '../domain/model/change-equipment-status.command';
import { ConfigureBpmCommand } from '../domain/model/configure-bpm.command';
import { RegisterMaintenanceCommand } from '../domain/model/register-maintenance.command';
import { ATTENTION_STATUSES } from '../domain/model/equipment-status';

/**
 * Maps an API failure to a translation key, or to the server message for business rule violations.
 *
 * @remarks
 * Connection failures (status 0), forbidden (403) and not found (404) responses are mapped to
 * their translation keys. For any other `ApiError` or `HttpErrorResponse`, the details or message
 * sent by the server are returned. Any other kind of error is mapped to a generic translation key.
 *
 * @param error - The error thrown by the API call.
 * @returns A translation key or the message sent by the server.
 *
 * @example
 * ```typescript
 * try {
 *   await firstValueFrom(api.getEquipment(10));
 * } catch (error) {
 *   console.log(equipmentError(error)); // 'equipment.errors.connection', for example
 * }
 * ```
 */
export function equipmentError(error: unknown): string {
  const status = error instanceof ApiError ? error.status : error instanceof HttpErrorResponse ? error.status : null;
  if (status === 0) return 'equipment.errors.connection';
  if (status === 403) return 'equipment.errors.forbidden';
  if (status === 404) return 'equipment.errors.not-found';
  if (error instanceof ApiError) return error.details || error.message;
  if (error instanceof HttpErrorResponse) return error.error?.details || error.error?.message || 'equipment.errors.failed';
  return 'equipment.errors.failed';
}

/**
 * Application store of the equipment and IoT devices of the current laboratory (US45-US54).
 *
 * @remarks
 * Equipment belongs to the laboratory; once located in an environment, its status changes and
 * maintenance are registered there. IoT devices (environmental devices and container monitors)
 * are the only equipment shown in the tracking views.
 *
 * The state is exposed through read-only signals. Operations that save data share a single
 * `saving` flag, and failures are exposed through the `error` signal.
 *
 * @example
 * ```typescript
 * const store = inject(EquipmentStore);
 *
 * store.loadEquipment();
 *
 * const devices = store.iotDevices(); // IoT devices of the laboratory
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EquipmentStore {
  /** Infrastructure facade used to reach the backend. */
  private readonly api = inject(EquipmentApi);

  /** Identity and access store, used for the session laboratory and the user permissions. */
  private readonly iam = inject(IamStore);

  /**
   * Discards late responses: the list and the selected equipment load independently.
   *
   * @remarks
   * Each load increments its counter; a response is only applied when its generation
   * is still the latest one.
   */
  private listGeneration = 0;
  private itemGeneration = 0;

  /** Equipment and IoT devices of the laboratory. */
  private readonly _equipmentList = signal<Equipment[]>([]);

  /** Equipment currently selected, or `null` if there is none. */
  private readonly _selectedEquipment = signal<Equipment | null>(null);

  /** BPM parameter configurations of the last equipment loaded. */
  private readonly _bpmConfigs = signal<BpmParameterConfig[]>([]);

  /** Maintenance records of the last equipment loaded. */
  private readonly _maintenanceHistory = signal<MaintenanceRecord[]>([]);

  /** Whether the equipment list is loading. */
  private readonly _listLoading = signal<boolean>(false);

  /** Whether the selected equipment is loading. */
  private readonly _itemLoading = signal<boolean>(false);

  /** Whether a save operation is in progress. */
  private readonly _saving = signal<boolean>(false);

  /** Translation key or server message of the last failure, or `null` if there is none. */
  private readonly _error = signal<string | null>(null);

  /** Translation key of the last success message, or `null` if there is none. */
  private readonly _successMsg = signal<string | null>(null);

  /** Equipment and IoT devices of the laboratory (read-only). */
  readonly equipmentList = this._equipmentList.asReadonly();

  /** Equipment currently selected, or `null` if there is none (read-only). */
  readonly selectedEquipment = this._selectedEquipment.asReadonly();

  /** BPM parameter configurations of the last equipment loaded (read-only). */
  readonly bpmConfigs = this._bpmConfigs.asReadonly();

  /** Maintenance records of the last equipment loaded (read-only). */
  readonly maintenanceHistory = this._maintenanceHistory.asReadonly();

  /** Whether the equipment list or the selected equipment is loading. */
  readonly isLoading = computed(() => this._listLoading() || this._itemLoading());

  /** Whether a save operation is in progress (read-only). */
  readonly saving = this._saving.asReadonly();

  /** Translation key or server message of the last failure. */
  readonly error = this._error.asReadonly();

  /** Translation key of the last success message (read-only). */
  readonly successMsg = this._successMsg.asReadonly();

  /** Equipment and devices are registered and located by quality managers and administrators (US45, US47). */
  readonly canManage = this.iam.canManageQuality;

  /** Status changes and maintenance are registered by operators and quality managers, not auditors. */
  readonly canOperate = this.iam.canOperate;

  /** IoT devices of the laboratory, the only equipment that sends telemetry. */
  readonly iotDevices = computed(() => this._equipmentList().filter((equipment) => equipment.isIotDevice));

  /** Equipment that is not an IoT device, used in manufacturing processes. */
  readonly processEquipment = computed(() => this._equipmentList().filter((equipment) => !equipment.isIotDevice));

  /** Equipment whose status is `OPERATIONAL`. */
  readonly operationalEquipment = computed(() =>
    this._equipmentList().filter((equipment) => equipment.status === 'OPERATIONAL'),
  );

  /** Equipment in maintenance or out of service. */
  readonly needsMaintenance = computed(() =>
    this._equipmentList().filter((equipment) => ATTENTION_STATUSES.includes(equipment.status)),
  );

  /**
   * Loads the equipment and IoT devices of the laboratory.
   *
   * @remarks
   * The load runs in the background; the result is exposed through `equipmentList`
   * and any failure through `error`.
   *
   * @param labId - The laboratory to load; the laboratory of the session by default
   */
  loadEquipment(labId: number = this.laboratoryId): void {
    void this.refresh(labId);
  }

  /**
   * Loads one equipment of the laboratory and keeps it as the selected equipment.
   *
   * @remarks
   * The previous selection is cleared before loading. If a newer load starts before this one
   * finishes, the late response is discarded.
   *
   * @param equipmentId - The identifier of the equipment to load.
   * @returns The equipment, or `null` when it could not be loaded or the response was discarded.
   */
  async loadEquipmentById(equipmentId: number): Promise<Equipment | null> {
    const generation = ++this.itemGeneration;
    this._selectedEquipment.set(null);
    this._itemLoading.set(true);
    this._error.set(null);
    try {
      const equipment = await firstValueFrom(this.api.getEquipmentById(this.laboratoryId, equipmentId));
      if (generation !== this.itemGeneration) return null;
      this.replace(equipment);
      return equipment;
    } catch (error) {
      if (generation === this.itemGeneration) this._error.set(equipmentError(error));
      return null;
    } finally {
      if (generation === this.itemGeneration) this._itemLoading.set(false);
    }
  }

  /**
   * Registers an equipment of the laboratory (US45).
   *
   * @remarks
   * The text fields of the command are trimmed before being sent.
   *
   * @param command - The data of the equipment to register.
   * @returns The registered equipment, or `null` when it could not be registered.
   */
  async registerEquipment(command: RegisterEquipmentCommand): Promise<Equipment | null> {
    return this.save(async () => {
      const equipment = await firstValueFrom(this.api.registerEquipment(this.laboratoryId, {
        name: command.name.trim(),
        type: command.type.trim(),
        model: command.model.trim(),
        serialNumber: command.serialNumber.trim(),
      }));
      this.replace(equipment);
      return equipment;
    });
  }

  /**
   * Registers an environmental device or container monitor (US51, US53) and, when an environment is
   * given, associates it with that environment (US52, US54).
   *
   * @remarks
   * The text fields of the command are trimmed before being sent; an empty firmware version is sent as `null`.
   *
   * @param command - The data of the device to register.
   * @param environmentId - The environment where the device will be located, or `null` to leave it unlocated.
   * @returns The device, or null when it could not be registered. When the association fails the
   * device stays registered and the error explains why it was not located.
   */
  async registerDevice(command: RegisterIotDeviceCommand, environmentId: number | null): Promise<Equipment | null> {
    const device = await this.save(async () => {
      const registered = await firstValueFrom(this.api.registerDevice(this.laboratoryId, command.deviceType, {
        name: command.name.trim(),
        sensorExternalId: command.sensorExternalId.trim(),
        serialNumber: command.serialNumber.trim(),
        model: command.model.trim(),
        firmwareVersion: command.firmwareVersion?.trim() || null,
      }));
      this.replace(registered);
      return registered;
    });
    if (!device || environmentId === null) return device;
    return (await this.assignToEnvironment(device, environmentId)) ?? device;
  }

  /**
   * Locates the equipment or IoT device in an environment of the laboratory (US47, US52, US54).
   *
   * @param equipment - The equipment or IoT device to locate.
   * @param environmentId - The environment where it will be located.
   * @returns The located equipment, or `null` when it could not be located.
   */
  async assignToEnvironment(equipment: Equipment, environmentId: number): Promise<Equipment | null> {
    return this.save(async () => {
      const located = await firstValueFrom(this.api.assignToEnvironment(this.laboratoryId, environmentId, equipment));
      this.replace(located);
      return located;
    });
  }

  /**
   * Registers a change of operational status of an equipment located in an environment (US48).
   *
   * @remarks
   * Once the change is registered, the equipment is reloaded so the store holds its updated status.
   * The reason is trimmed; an empty reason is sent as `null`.
   *
   * @param equipment - The equipment whose status changes; it must be located in an environment.
   * @param command - The new status and its reason.
   * @returns `true` if the change was registered; `false` if the equipment is not located in an
   * environment or the operation failed.
   */
  async changeStatus(equipment: Equipment, command: ChangeEquipmentStatusCommand): Promise<boolean> {
    if (equipment.environmentId === null) return false;
    const environmentId = equipment.environmentId;
    const updated = await this.save(async () => {
      await firstValueFrom(this.api.changeStatus(this.laboratoryId, environmentId, equipment.id, {
        status: command.status,
        reason: command.reason?.trim() || null,
      }));
      const reloaded = await firstValueFrom(this.api.getEquipmentById(this.laboratoryId, equipment.id));
      this.replace(reloaded);
      return reloaded;
    });
    return updated !== null;
  }

  /**
   * Loads the maintenance history of an equipment located in an environment (US50).
   *
   * @remarks
   * The history is cleared first. If the equipment is not located in an environment it stays empty.
   * A failure is exposed through `error`.
   *
   * @param equipment - The equipment whose maintenance history is loaded.
   */
  async loadMaintenanceHistory(equipment: Equipment): Promise<void> {
    this._maintenanceHistory.set([]);
    if (equipment.environmentId === null) return;
    try {
      this._maintenanceHistory.set(await firstValueFrom(
        this.api.getMaintenanceHistory(this.laboratoryId, equipment.environmentId, equipment.id)));
    } catch (error) {
      this._error.set(equipmentError(error));
    }
  }

  /**
   * Registers a maintenance performed on an equipment located in an environment (US49).
   *
   * @remarks
   * The description is trimmed. When the record is registered, it is added at the beginning of
   * the maintenance history.
   *
   * @param equipment - The equipment that received the maintenance; it must be located in an environment.
   * @param command - The data of the maintenance to register.
   * @returns `true` if the maintenance was registered; `false` if the equipment is not located in an
   * environment or the operation failed.
   */
  async registerMaintenance(equipment: Equipment, command: RegisterMaintenanceCommand): Promise<boolean> {
    if (equipment.environmentId === null) return false;
    const environmentId = equipment.environmentId;
    const record = await this.save(() => firstValueFrom(this.api.registerMaintenance(
      this.laboratoryId, environmentId, equipment.id, {
        ...command,
        description: command.description.trim(),
      })));
    if (record) this._maintenanceHistory.update((history) => [record, ...history]);
    return record !== null;
  }

  /**
   * Loads the BPM parameter limits of an equipment.
   *
   * @remarks
   * The result is exposed through `bpmConfigs` and any failure through `error`.
   *
   * @param equipmentId - The identifier of the equipment.
   */
  loadBpmConfig(equipmentId: number): void {
    this.api.getBpmConfig(this.iam.requireLaboratoryId(), equipmentId).subscribe({
      next: (configs) => this._bpmConfigs.set(configs),
      error: (error: unknown) => this._error.set(equipmentError(error)),
    });
  }

  /**
   * Configures the limits of a BPM parameter of an equipment.
   *
   * @remarks
   * When the configuration is saved, the BPM configurations of the equipment are reloaded and
   * the success message `bpm-config.saved` is set. A failure is exposed through `error`.
   *
   * @param command - The BPM parameter configuration to apply.
   */
  configureBpm(command: ConfigureBpmCommand): void {
    this._saving.set(true);
    this._error.set(null);
    this.api.configureBpm(this.iam.requireLaboratoryId(), command).subscribe({
      next: () => {
        this.loadBpmConfig(command.equipmentId);
        this._successMsg.set('bpm-config.saved');
        this._saving.set(false);
      },
      error: (error: unknown) => {
        this._error.set(equipmentError(error));
        this._saving.set(false);
      },
    });
  }

  /**
   * Clears the error and success messages.
   */
  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Reloads the equipment list of a laboratory.
   *
   * @remarks
   * If a newer load starts before this one finishes, the late response is discarded.
   *
   * @param labId - The identifier of the laboratory to load.
   */
  private async refresh(labId: number): Promise<void> {
    const generation = ++this.listGeneration;
    this._listLoading.set(true);
    this._error.set(null);
    try {
      const equipment = await firstValueFrom(this.api.getEquipment(labId));
      if (generation === this.listGeneration) this._equipmentList.set(equipment);
    } catch (error) {
      if (generation === this.listGeneration) this._error.set(equipmentError(error));
    } finally {
      if (generation === this.listGeneration) this._listLoading.set(false);
    }
  }

  /**
   * Runs a save operation while keeping the `saving` flag and the error up to date.
   *
   * @remarks
   * If another save is already in progress the operation is not run. Failures are
   * exposed through `error` instead of being thrown.
   *
   * @typeParam T - The type of the value returned by the operation.
   * @param operation - The save operation to run.
   * @returns The value returned by the operation, or `null` if it failed or was not run.
   */
  private async save<T>(operation: () => Promise<T>): Promise<T | null> {
    if (this._saving()) return null;
    this._saving.set(true);
    this._error.set(null);
    try {
      return await operation();
    } catch (error) {
      this._error.set(equipmentError(error));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  /**
   * Stores an equipment in the list and makes it the selected equipment.
   *
   * @remarks
   * If the equipment is already in the list it is replaced; otherwise it is added and the
   * list is sorted by name.
   *
   * @param equipment - The equipment to store.
   */
  private replace(equipment: Equipment): void {
    this._selectedEquipment.set(equipment);
    this._equipmentList.update((list) => list.some((item) => item.id === equipment.id)
      ? list.map((item) => (item.id === equipment.id ? equipment : item))
      : [...list, equipment].sort((a, b) => a.name.localeCompare(b.name)));
  }

  /**
   * The identifier of the laboratory of the current session.
   */
  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }
}
