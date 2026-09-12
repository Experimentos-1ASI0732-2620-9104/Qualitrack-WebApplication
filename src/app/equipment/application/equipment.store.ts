import { Injectable, computed, inject, signal } from '@angular/core';
import { retry } from 'rxjs';
import { EquipmentApi } from '../infrastructure/equipment-api';
import { Equipment } from '../domain/model/equipment.entity';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { RegisterEquipmentCommand } from '../domain/model/register-equipment.command';
import { ConfigureBpmCommand } from '../domain/model/configure-bpm.command';
import { RegisterMaintenanceCommand } from '../domain/model/register-maintenance.command';

/**
 * Store service responsible for managing equipment-related application state.
 *
 * @remarks
 * This store centralizes the state and operations related to equipment,
 * BPM parameter configurations, and maintenance history.
 *
 * It uses Angular signals to manage reactive state, computed selectors to
 * derive filtered equipment lists, and the EquipmentApi service to communicate
 * with the infrastructure layer.
 */
@Injectable({ providedIn: 'root' })
export class EquipmentStore {
  /**
   * API facade used to execute equipment, BPM configuration, and maintenance operations.
   */
  private readonly api = inject(EquipmentApi);

  /**
   * Internal signal that stores the complete list of equipment.
   */
  private readonly _equipmentList = signal<Equipment[]>([]);

  /**
   * Internal signal that stores the currently selected equipment.
   */
  private readonly _selectedEquipment = signal<Equipment | null>(null);

  /**
   * Internal signal that stores BPM parameter configurations.
   */
  private readonly _bpmConfigs = signal<BpmParameterConfig[]>([]);

  /**
   * Internal signal that stores the maintenance history of an equipment.
   */
  private readonly _maintenanceHistory = signal<MaintenanceRecord[]>([]);

  /**
   * Internal signal that indicates whether an asynchronous operation is running.
   */
  private readonly _isLoading = signal<boolean>(false);

  /**
   * Internal signal that stores the current error message.
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Internal signal that stores the current success message.
   */
  private readonly _successMsg = signal<string | null>(null);

  /**
   * Readonly selector for the equipment list.
   */
  readonly equipmentList = this._equipmentList.asReadonly();

  /**
   * Readonly selector for the selected equipment.
   */
  readonly selectedEquipment = this._selectedEquipment.asReadonly();

  /**
   * Readonly selector for BPM parameter configurations.
   */
  readonly bpmConfigs = this._bpmConfigs.asReadonly();

  /**
   * Readonly selector for maintenance history.
   */
  readonly maintenanceHistory = this._maintenanceHistory.asReadonly();

  /**
   * Readonly selector for the loading state.
   */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Readonly selector for the current error message.
   */
  readonly error = this._error.asReadonly();

  /**
   * Readonly selector for the current success message.
   */
  readonly successMsg = this._successMsg.asReadonly();

  /**
   * Computed selector that returns only operational equipment.
   */
  readonly operationalEquipment = computed(() =>
    this._equipmentList().filter((equipment) => equipment.status === 'OPERATIONAL'),
  );

  /**
   * Computed selector that returns equipment requiring maintenance or service attention.
   */
  readonly needsMaintenance = computed(() =>
    this._equipmentList().filter(
      (equipment) =>
        equipment.status === 'MAINTENANCE' ||
        equipment.status === 'OUT_OF_SERVICE' ||
        equipment.status === 'CALIBRATION_REQUIRED',
    ),
  );

  /**
   * Loads the equipment registered in a specific laboratory.
   *
   * @param labId - The numeric identifier of the laboratory whose equipment will be loaded
   */
  loadEquipment(labId: number): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getEquipment(labId)
      .pipe(retry(2))
      .subscribe({
        next: (equipment: Equipment[]) => {
          this._equipmentList.set(equipment);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to load equipment list'));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Loads a specific equipment by its numeric identifier.
   *
   * @param equipmentId - The numeric identifier of the equipment to load
   *
   * @remarks
   * This method supports direct navigation to the equipment detail view.
   * If the user opens `/equipments/equipment-detail/:id` directly, the selected
   * equipment is still retrieved even when the equipment list was not loaded first.
   */
  loadEquipmentById(equipmentId: number): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getEquipmentById(equipmentId)
      .pipe(retry(2))
      .subscribe({
        next: (equipment: Equipment) => {
          this._selectedEquipment.set(equipment);

          this._equipmentList.update((list) => {
            const exists = list.some((item) => item.id === equipment.id);

            if (exists) {
              return list.map((item) => (item.id === equipment.id ? equipment : item));
            }

            return [...list, equipment];
          });

          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, `Failed to load equipment ${equipmentId}`));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Registers a new equipment and updates the equipment list state.
   *
   * @param command - The command containing the required equipment registration data
   */
  registerEquipment(command: RegisterEquipmentCommand): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .registerEquipment(command)
      .pipe(retry(2))
      .subscribe({
        next: (equipment: Equipment) => {
          this._equipmentList.update((list) => [...list, equipment]);
          this._selectedEquipment.set(equipment);
          this._successMsg.set('Equipment registered successfully');
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to register equipment'));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Loads BPM parameter configurations for a specific equipment.
   *
   * @param equipmentId - The numeric identifier of the equipment whose BPM configurations will be loaded
   */
  loadBpmConfig(equipmentId: number): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getBpmConfig(equipmentId)
      .pipe(retry(2))
      .subscribe({
        next: (configs: BpmParameterConfig[]) => {
          this._bpmConfigs.set(configs);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to load BPM configurations'));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Configures a BPM parameter for an equipment.
   *
   * @param command - The command containing the BPM parameter configuration data
   */
  configureBpm(command: ConfigureBpmCommand): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .configureBpm(command)
      .pipe(retry(2))
      .subscribe({
        next: () => {
          this.loadBpmConfig(command.equipmentId);
          this._successMsg.set('BPM parameter configured successfully');
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to configure BPM parameter'));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Loads the maintenance history for a specific equipment.
   *
   * @param equipmentId - The numeric identifier of the equipment whose maintenance history will be loaded
   */
  loadMaintenanceHistory(equipmentId: number): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getMaintenanceHistory(equipmentId)
      .pipe(retry(2))
      .subscribe({
        next: (history: MaintenanceRecord[]) => {
          this._maintenanceHistory.set(history);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to load maintenance history'));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Registers a maintenance record for an equipment.
   *
   * @param command - The command containing the maintenance registration data
   */
  registerMaintenance(command: RegisterMaintenanceCommand): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .registerMaintenance(command)
      .pipe(retry(2))
      .subscribe({
        next: () => {
          this.loadMaintenanceHistory(command.equipmentId);
          this._successMsg.set('Maintenance record registered successfully');
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          this._error.set(this.formatError(err, 'Failed to register maintenance'));
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Clears active error and success messages.
   */
  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Formats an error object into a readable message.
   *
   * @param error - The received error object
   * @param fallback - The fallback message used when the error cannot be interpreted
   * @returns A readable error message
   */
  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not Found`
        : error.message;
    }

    return fallback;
  }
}
