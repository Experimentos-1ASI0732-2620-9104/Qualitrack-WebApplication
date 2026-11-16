import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, firstValueFrom, retry, tap } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { LaboratoryApi } from '../infrastructure/laboratory-api';

import { Laboratory } from '../domain/model/laboratory.entity';
import { StaffMember } from '../domain/model/staff-member.entity';
import { Environment } from '../domain/model/environment.entity';
import { EnvironmentUsage } from '../domain/model/environment-usage';

import { CreateLaboratoryCommand } from '../domain/model/create-laboratory.command';
import { UpdateLaboratoryCommand } from '../domain/model/update-laboratory.command';
import { RegisterStaffCommand, RegisteredStaff } from '../domain/model/register-staff.command';
import { RegisterEnvironmentCommand } from '../domain/model/register-environment.command';
import { UpdateEnvironmentCommand } from '../domain/model/update-environment.command';

export { errorStatus } from '../../shared/infrastructure/api-error';

/**
 * Application store for managing Laboratory bounded context state.
 *
 * @remarks
 * This store coordinates the presentation layer with the Laboratory API facade.
 * It exposes readonly Angular signals for laboratory profile data, staff, environments,
 * loading state, and user-facing messages. Products belong to Product Batch Management and
 * raw materials to Inventory Management.
 *
 * Environments always belong to the laboratory of the authenticated session; their write
 * operations are only offered to quality managers and administrators, as enforced by the
 * backend (TS15-TS18). The other bounded contexts read the environments through their own models.
 */
@Injectable({ providedIn: 'root' })
export class LaboratoryStore {
  /**
   * Internal signal containing the currently loaded laboratory profile.
   */
  private readonly _laboratory = signal<Laboratory | null>(null);

  /**
   * Internal signal containing staff members for the current laboratory.
   */
  private readonly _staffList = signal<StaffMember[]>([]);

  /**
   * Internal signal indicating whether an API operation is running.
   */
  private readonly _isLoading = signal<boolean>(false);

  /**
   * Internal signal containing the latest error message, if any.
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Internal signal containing the latest success message, if any.
   */
  private readonly _successMsg = signal<string | null>(null);

  /**
   * Readonly signal exposing the currently loaded laboratory profile.
   */
  readonly laboratory = this._laboratory.asReadonly();

  /**
   * Readonly signal exposing staff members.
   */
  readonly staffList = this._staffList.asReadonly();

  /**
   * Readonly signal exposing loading state.
   */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Readonly signal exposing the latest error message.
   */
  readonly error = this._error.asReadonly();

  /**
   * Readonly signal exposing the latest success message.
   */
  readonly successMsg = this._successMsg.asReadonly();

  /**
   * Computed signal exposing only active staff members.
   */
  readonly activeStaff = computed(() => this._staffList().filter((staff) => staff.active));

  /**
   * Store that exposes the authenticated session and the current laboratory.
   */
  private readonly iam = inject(IamStore);

  /**
   * Internal signal containing the environments of the current laboratory.
   */
  private readonly _environments = signal<Environment[]>([]);

  /**
   * Internal signal indicating whether an environment operation is running.
   */
  private readonly _environmentsLoading = signal<boolean>(false);

  /**
   * Internal signal containing the latest environment error message, if any.
   */
  private readonly _environmentError = signal<string | null>(null);

  /**
   * Internal signal indicating whether the environments have been loaded at least once.
   */
  private readonly _environmentsLoaded = signal<boolean>(false);

  /**
   * Environments of the current laboratory ordered by code.
   */
  readonly environments = this._environments.asReadonly();

  /**
   * Indicates whether an environment operation is running.
   */
  readonly environmentsLoading = this._environmentsLoading.asReadonly();

  /**
   * Latest user-facing error message of an environment operation, if any.
   */
  readonly environmentError = this._environmentError.asReadonly();

  /**
   * Indicates whether the environments have been loaded at least once.
   */
  readonly environmentsLoaded = this._environmentsLoaded.asReadonly();

  /**
   * Indicates whether the current user can register, update and classify environments.
   */
  readonly canManageEnvironments = this.iam.canManageQuality;

  /**
   * Indicates whether the laboratory has no environments after loading.
   */
  readonly environmentsEmpty = computed(() => this._environmentsLoaded() && this._environments().length === 0);

  /**
   * Creates a new LaboratoryStore.
   *
   * @param api - Laboratory API facade used for HTTP operations
   */
  constructor(private readonly api: LaboratoryApi) {}

  /**
   * Creates a new laboratory and stores the created profile.
   *
   * @remarks
   * The request is not retried, so the same laboratory is never registered twice.
   *
   * @param command - Command containing laboratory registration data
   * @param onCreated - Optional callback invoked with the created laboratory after it is stored
   */
  createLaboratory(command: CreateLaboratoryCommand, onCreated?: (laboratory: Laboratory) => void): void {
    this.startOperation();

    this.api
      .createLaboratory(command)
      .subscribe({
        next: (laboratory: Laboratory) => {
          this._laboratory.set(laboratory);
          this._successMsg.set('Laboratory created successfully');
          this.finishOperation();
          onCreated?.(laboratory);
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to create laboratory');
        },
      });
  }

  /**
   * Loads a laboratory profile by its numeric identifier.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   */
  loadLaboratory(laboratoryId: number): void {
    this.startOperation();

    this.api
      .getLaboratory(laboratoryId)
      .pipe(retry(2))
      .subscribe({
        next: (laboratory: Laboratory) => {
          this._laboratory.set(laboratory);
          this.finishOperation();
        },
        error: (error: unknown) => {
          this.failOperation(error, `Failed to fetch laboratory ${laboratoryId}`);
        },
      });
  }

  /**
   * Updates mutable laboratory profile information.
   *
   * @param laboratoryId - Numeric identifier of the laboratory to update
   * @param command - Command containing updated laboratory data
   */
  updateLaboratory(laboratoryId: number, command: UpdateLaboratoryCommand): void {
    this.startOperation();

    this.api
      .updateLaboratory(laboratoryId, command)
      .pipe(retry(2))
      .subscribe({
        next: (laboratory: Laboratory) => {
          this._laboratory.set(laboratory);
          this._successMsg.set('Laboratory updated successfully');
          this.finishOperation();
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to update laboratory');
        },
      });
  }

  /**
   * Loads staff members associated with a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   */
  loadStaff(laboratoryId: number): void {
    this.startOperation();

    this.api
      .getStaff(laboratoryId)
      .pipe(retry(2))
      .subscribe({
        next: (staff: StaffMember[]) => {
          this._staffList.set(staff);
          this.finishOperation();
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to load staff');
        },
      });
  }

  /**
   * Reads one staff member of a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param staffId - Numeric identifier of the staff member
   * @returns Observable emitting the staff member
   */
  staffMember(laboratoryId: number, staffId: number): Observable<StaffMember> {
    return this.api.getStaffMember(laboratoryId, staffId);
  }

  /**
   * Registers a new staff member under a laboratory; the platform creates their account.
   *
   * @remarks
   * The request is not retried: a repeated POST would try to register the same e-mail again.
   * The caller shows the delivery of the credentials, which the platform returns only once.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param command - Command containing staff registration data
   * @returns Observable emitting the registered staff member and the delivery of their credentials
   */
  registerStaff(laboratoryId: number, command: RegisterStaffCommand): Observable<RegisteredStaff> {
    this.startOperation();
    return this.api.registerStaff(laboratoryId, { ...command }).pipe(
      tap((registered) => this._staffList.update((staffList) => [
        ...staffList.filter((staff) => staff.id !== registered.staffMember.id), registered.staffMember,
      ])),
      finalize(() => this.finishOperation()),
    );
  }

  /**
   * Deactivates an existing staff member, who can no longer sign in.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param staffId - Numeric identifier of the staff member to deactivate
   * @returns Observable emitting the deactivated staff member
   */
  deactivateStaff(laboratoryId: number, staffId: number): Observable<StaffMember> {
    this.startOperation();
    return this.api.deactivateStaff(laboratoryId, staffId).pipe(
      tap((deactivated) => this._staffList.update((staffList) =>
        staffList.map((staff) => (staff.id === deactivated.id ? deactivated : staff)),
      )),
      finalize(() => this.finishOperation()),
    );
  }

  /**
   * Loads the environments of the current laboratory.
   *
   * @remarks
   * On failure the error is exposed through {@link LaboratoryStore.environmentError} and the
   * previous list is kept.
   *
   * @returns A promise that resolves when the operation finishes
   */
  async loadEnvironments(): Promise<void> {
    this.startEnvironmentOperation();
    try {
      this._environments.set(await firstValueFrom(this.api.getEnvironments(this.laboratoryId)));
      this._environmentsLoaded.set(true);
    } catch (error) {
      this.failEnvironmentOperation(error, 'Failed to load environments');
    } finally {
      this._environmentsLoading.set(false);
    }
  }

  /**
   * Loads one environment of the current laboratory.
   *
   * @param environmentId - Numeric identifier of the environment
   * @returns The environment, or `null` when it cannot be loaded
   */
  async loadEnvironment(environmentId: number): Promise<Environment | null> {
    this.startEnvironmentOperation();
    try {
      return await firstValueFrom(this.api.getEnvironment(this.laboratoryId, environmentId));
    } catch (error) {
      this.failEnvironmentOperation(error, 'Failed to load environment');
      return null;
    } finally {
      this._environmentsLoading.set(false);
    }
  }

  /**
   * Registers an environment and, when requested, assigns its usage.
   *
   * @remarks
   * The usage is assigned in a second request. The list is refreshed even when that
   * request fails, so an environment created without its usage is still shown.
   *
   * @param command - Command with the environment data and optional usage
   * @returns `true` when the environment (and its usage) were saved
   */
  async registerEnvironment(command: RegisterEnvironmentCommand): Promise<boolean> {
    this.startEnvironmentOperation();
    try {
      const created = await firstValueFrom(
        this.api.createEnvironment(this.laboratoryId, {
          code: command.code,
          name: command.name,
          description: command.description,
        }),
      );
      if (command.usage) {
        await firstValueFrom(
          this.api.assignEnvironmentUsage(this.laboratoryId, created.id, { usage: command.usage }),
        );
      }
      await this.refreshEnvironments();
      return true;
    } catch (error) {
      this.failEnvironmentOperation(error, 'Failed to register environment');
      await this.refreshEnvironments();
      return false;
    } finally {
      this._environmentsLoading.set(false);
    }
  }

  /**
   * Updates the identification data of an environment.
   *
   * @param environmentId - Numeric identifier of the environment
   * @param command - Command with the new data
   * @returns `true` when the environment was updated
   */
  async updateEnvironment(environmentId: number, command: UpdateEnvironmentCommand): Promise<boolean> {
    this.startEnvironmentOperation();
    try {
      await firstValueFrom(this.api.updateEnvironment(this.laboratoryId, environmentId, command));
      await this.refreshEnvironments();
      return true;
    } catch (error) {
      this.failEnvironmentOperation(error, 'Failed to update environment');
      return false;
    } finally {
      this._environmentsLoading.set(false);
    }
  }

  /**
   * Assigns the main use of an environment.
   *
   * @param environmentId - Numeric identifier of the environment
   * @param usage - Usage to assign
   * @returns `true` when the usage was assigned
   */
  async assignEnvironmentUsage(environmentId: number, usage: EnvironmentUsage): Promise<boolean> {
    this.startEnvironmentOperation();
    try {
      await firstValueFrom(this.api.assignEnvironmentUsage(this.laboratoryId, environmentId, { usage }));
      await this.refreshEnvironments();
      return true;
    } catch (error) {
      this.failEnvironmentOperation(error, 'Failed to assign environment usage');
      return false;
    } finally {
      this._environmentsLoading.set(false);
    }
  }

  /**
   * Clears the latest error message of an environment operation.
   */
  clearEnvironmentError(): void {
    this._environmentError.set(null);
  }

  /**
   * Clears active user-facing messages from the store.
   */
  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Initializes operation state before an API call.
   */
  private startOperation(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Marks the current operation as finished.
   */
  private finishOperation(): void {
    this._isLoading.set(false);
  }

  /**
   * Stores a formatted error message and marks the operation as finished.
   *
   * @param error - Error value emitted by the failed operation
   * @param fallback - Fallback message used when the error cannot be parsed
   */
  private failOperation(error: unknown, fallback: string): void {
    this._error.set(this.formatError(error, fallback));
    this._isLoading.set(false);
  }

  /**
   * Identifier of the laboratory of the authenticated session.
   *
   * @throws Error when the user has not set up a laboratory yet
   */
  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }

  /**
   * Reloads the environments after a write operation without reporting errors.
   *
   * @returns A promise that resolves when the reload finishes
   */
  private async refreshEnvironments(): Promise<void> {
    try {
      this._environments.set(await firstValueFrom(this.api.getEnvironments(this.laboratoryId)));
      this._environmentsLoaded.set(true);
    } catch {
      // The original operation result is already reported; a failed refresh keeps the previous list.
    }
  }

  /**
   * Initializes the environment state before an API call.
   */
  private startEnvironmentOperation(): void {
    this._environmentsLoading.set(true);
    this._environmentError.set(null);
  }

  /**
   * Stores a user-facing message for a failed environment operation.
   *
   * @param error - Error value thrown by the failed operation
   * @param fallback - Message used when the error carries no message
   */
  private failEnvironmentOperation(error: unknown, fallback: string): void {
    if (error instanceof ApiError) {
      this._environmentError.set(error.details ?? error.message);
    } else if (error instanceof Error) {
      this._environmentError.set(error.message);
    } else {
      this._environmentError.set(fallback);
    }
  }

  /**
   * Converts an unknown error value into a user-facing message.
   *
   * @param error - Error value emitted by an API call
   * @param fallback - Default message used when no specific error is available
   * @returns Formatted error message
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
