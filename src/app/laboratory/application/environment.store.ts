import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { LaboratoryApi } from '../infrastructure/laboratory-api';
import { Environment } from '../domain/model/environment.entity';
import { EnvironmentUsage } from '../domain/model/environment-usage';
import { RegisterEnvironmentCommand } from '../domain/model/register-environment.command';
import { UpdateEnvironmentCommand } from '../domain/model/update-environment.command';

/**
 * Features that remember the environment the user works with.
 *
 * @remarks
 * Each scope keeps its own remembered environment, so choosing an environment in
 * inventory does not change the one opened by production or tracking.
 */
export type EnvironmentScope = 'inventory' | 'production' | 'tracking';

/**
 * Application store for the environments of the current laboratory.
 *
 * @remarks
 * Coordinates the environment views with the Laboratory API facade (TS15-TS18).
 * The laboratory always comes from the authenticated session; write operations are
 * only offered to quality managers and administrators, as enforced by the backend.
 */
@Injectable({ providedIn: 'root' })
export class EnvironmentStore {
  /**
   * Laboratory API facade used for HTTP operations.
   */
  private readonly api = inject(LaboratoryApi);

  /**
   * Store that exposes the authenticated session and the current laboratory.
   */
  private readonly iam = inject(IamStore);

  /**
   * Internal signal containing the environments of the current laboratory.
   */
  private readonly _environments = signal<Environment[]>([]);

  /**
   * Internal signal indicating whether an API operation is running.
   */
  private readonly _isLoading = signal<boolean>(false);

  /**
   * Internal signal containing the latest error message, if any.
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Internal signal indicating whether the environments have been loaded at least once.
   */
  private readonly _loaded = signal<boolean>(false);

  /**
   * Environments of the current laboratory ordered by code.
   */
  readonly environments = this._environments.asReadonly();

  /**
   * Indicates whether an API operation is running.
   */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Latest user-facing error message, if any.
   */
  readonly error = this._error.asReadonly();

  /**
   * Indicates whether the environments have been loaded at least once.
   */
  readonly loaded = this._loaded.asReadonly();

  /**
   * Indicates whether the current user can register, update and classify environments.
   */
  readonly canManage = this.iam.canManageQuality;

  /**
   * Indicates whether the laboratory has no environments after loading.
   */
  readonly isEmpty = computed(() => this._loaded() && this._environments().length === 0);

  /**
   * Identifier of the laboratory of the authenticated session.
   *
   * @throws Error when the user has not set up a laboratory yet
   */
  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }

  /**
   * Loads the environments of the current laboratory.
   *
   * @remarks
   * On failure the error is exposed through {@link EnvironmentStore.error} and the
   * previous list is kept.
   *
   * @returns A promise that resolves when the operation finishes
   */
  async loadEnvironments(): Promise<void> {
    this.start();
    try {
      this._environments.set(await firstValueFrom(this.api.getEnvironments(this.laboratoryId)));
      this._loaded.set(true);
    } catch (error) {
      this.fail(error, 'Failed to load environments');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Loads one environment of the current laboratory.
   *
   * @param environmentId - Numeric identifier of the environment
   * @returns The environment, or `null` when it cannot be loaded
   */
  async loadEnvironment(environmentId: number): Promise<Environment | null> {
    this.start();
    try {
      return await firstValueFrom(this.api.getEnvironment(this.laboratoryId, environmentId));
    } catch (error) {
      this.fail(error, 'Failed to load environment');
      return null;
    } finally {
      this._isLoading.set(false);
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
  async register(command: RegisterEnvironmentCommand): Promise<boolean> {
    this.start();
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
      await this.refresh();
      return true;
    } catch (error) {
      this.fail(error, 'Failed to register environment');
      await this.refresh();
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Updates the identification data of an environment.
   *
   * @param environmentId - Numeric identifier of the environment
   * @param command - Command with the new data
   * @returns `true` when the environment was updated
   */
  async update(environmentId: number, command: UpdateEnvironmentCommand): Promise<boolean> {
    this.start();
    try {
      await firstValueFrom(this.api.updateEnvironment(this.laboratoryId, environmentId, command));
      await this.refresh();
      return true;
    } catch (error) {
      this.fail(error, 'Failed to update environment');
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Assigns the main use of an environment.
   *
   * @param environmentId - Numeric identifier of the environment
   * @param usage - Usage to assign
   * @returns `true` when the usage was assigned
   */
  async assignUsage(environmentId: number, usage: EnvironmentUsage): Promise<boolean> {
    this.start();
    try {
      await firstValueFrom(this.api.assignEnvironmentUsage(this.laboratoryId, environmentId, { usage }));
      await this.refresh();
      return true;
    } catch (error) {
      this.fail(error, 'Failed to assign environment usage');
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Picks the environment to open by default: the last one used in this browser, otherwise the first
   * environment with the preferred usage, otherwise the first environment.
   *
   * @param preferredUsage - Usage that fits the calling feature, for example `RAW_MATERIAL_STORAGE`
   * @param scope - Feature that remembers its own environment, so inventory and production do not
   *   overwrite each other; `'inventory'` when omitted
   * @returns The environment to open, or `null` when the laboratory has no environments
   */
  preferredEnvironment(preferredUsage?: EnvironmentUsage, scope: EnvironmentScope = 'inventory'): Environment | null {
    const environments = this._environments();
    const remembered = this.rememberedEnvironmentId(scope);
    return environments.find((environment) => environment.id === remembered)
      ?? environments.find((environment) => environment.usage === preferredUsage)
      ?? environments[0]
      ?? null;
  }

  /**
   * Remembers the environment the user is working with, only as a per-browser convenience.
   *
   * @remarks
   * The preference is kept in `localStorage`; when storage is unavailable it is silently skipped.
   *
   * @param environmentId - Numeric identifier of the environment
   * @param scope - Feature that remembers the environment; `'inventory'` when omitted
   */
  rememberEnvironment(environmentId: number, scope: EnvironmentScope = 'inventory'): void {
    try {
      localStorage.setItem(this.preferenceKey(scope), String(environmentId));
    } catch {
      // Storage can be unavailable (private mode); the preference is optional.
    }
  }

  /**
   * Clears the latest error message.
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reads the environment remembered for a feature in this browser.
   *
   * @param scope - Feature that remembers the environment
   * @returns The remembered environment identifier, or `null` when there is none or storage is unavailable
   */
  private rememberedEnvironmentId(scope: EnvironmentScope): number | null {
    try {
      const value = Number(localStorage.getItem(this.preferenceKey(scope)));
      return Number.isInteger(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  /**
   * Builds the storage key of the remembered environment of a feature.
   *
   * @param scope - Feature that remembers the environment
   * @returns Storage key scoped by laboratory and feature
   */
  private preferenceKey(scope: EnvironmentScope): string {
    return `qualitrack.environment.${this.laboratoryId}.${scope}`;
  }

  /**
   * Reloads the environments after a write operation without reporting errors.
   *
   * @returns A promise that resolves when the reload finishes
   */
  private async refresh(): Promise<void> {
    try {
      this._environments.set(await firstValueFrom(this.api.getEnvironments(this.laboratoryId)));
      this._loaded.set(true);
    } catch {
      // The original operation result is already reported; a failed refresh keeps the previous list.
    }
  }

  /**
   * Initializes operation state before an API call.
   */
  private start(): void {
    this._isLoading.set(true);
    this._error.set(null);
  }

  /**
   * Stores a user-facing message for a failed operation.
   *
   * @param error - Error value thrown by the failed operation
   * @param fallback - Message used when the error carries no message
   */
  private fail(error: unknown, fallback: string): void {
    if (error instanceof ApiError) {
      this._error.set(error.details ?? error.message);
    } else if (error instanceof Error) {
      this._error.set(error.message);
    } else {
      this._error.set(fallback);
    }
  }
}
