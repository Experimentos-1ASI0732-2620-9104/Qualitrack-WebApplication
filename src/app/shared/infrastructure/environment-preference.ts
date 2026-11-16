/**
 * Areas of the application that remember the environment the user works with: raw material storage
 * (`inventory`), production (`production`) and monitoring (`tracking`, shared by the readings, the alerts and the
 * deviation trends).
 */
export type EnvironmentPreferenceScope = 'inventory' | 'production' | 'tracking';

/**
 * Environment that can be remembered: its identifier and, when the context knows it, its usage.
 */
export interface PreferableEnvironment {
  id: number;
  usage?: string | null;
}

/**
 * Environment remembered in this browser for one area of the laboratory, only as a per-browser convenience.
 *
 * @remarks
 * Each bounded context keeps its own environments; this class only stores the identifier under
 * `qualitrack.environment.{laboratoryId}.{scope}` in `localStorage`. When storage is unavailable (private mode) the
 * preference is silently skipped.
 */
export class EnvironmentPreference {
  constructor(private readonly scope: EnvironmentPreferenceScope) {}

  /**
   * Picks the environment to open: the remembered one, otherwise the first one with the preferred usage, otherwise
   * the first one.
   *
   * @param laboratoryId - The laboratory of the session
   * @param environments - Environments of the laboratory, as the calling context knows them
   * @param preferredUsage - Usage that fits the calling view, for example `RAW_MATERIAL_STORAGE`
   * @returns The environment to open, or null when there is none
   */
  choose<T extends PreferableEnvironment>(
    laboratoryId: number,
    environments: readonly T[],
    preferredUsage?: string,
  ): T | null {
    const remembered = this.read(laboratoryId);
    return (
      environments.find((environment) => environment.id === remembered) ??
      environments.find((environment) => preferredUsage !== undefined && environment.usage === preferredUsage) ??
      environments[0] ??
      null
    );
  }

  /**
   * Remembers the environment the user chose.
   *
   * @param laboratoryId - The laboratory of the session
   * @param environmentId - The environment identifier
   */
  remember(laboratoryId: number, environmentId: number): void {
    try {
      localStorage.setItem(this.key(laboratoryId), String(environmentId));
    } catch {
      // Storage can be unavailable (private mode); the preference is optional.
    }
  }

  /**
   * Reads the remembered environment.
   *
   * @param laboratoryId - The laboratory of the session
   * @returns The environment identifier, or null when there is none or storage is unavailable
   */
  read(laboratoryId: number): number | null {
    try {
      const value = Number(localStorage.getItem(this.key(laboratoryId)));
      return Number.isInteger(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  private key(laboratoryId: number): string {
    return `qualitrack.environment.${laboratoryId}.${this.scope}`;
  }
}
