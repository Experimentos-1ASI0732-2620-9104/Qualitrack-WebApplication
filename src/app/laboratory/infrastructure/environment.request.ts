import { EnvironmentUsage } from '../domain/model/environment-usage';

/**
 * Request payload for `POST /laboratories/{laboratoryId}/environments`.
 */
export interface CreateEnvironmentRequest {
  /**
   * Identification of the environment, unique within the laboratory.
   */
  code: string;

  /**
   * Display name of the environment.
   */
  name: string;

  /**
   * Optional description of the environment.
   */
  description: string | null;
}

/**
 * Request payload for `PUT /laboratories/{laboratoryId}/environments/{environmentId}`.
 */
export interface UpdateEnvironmentRequest {
  /**
   * New identification of the environment, unique within the laboratory.
   */
  code: string;

  /**
   * New display name of the environment.
   */
  name: string;

  /**
   * New optional description of the environment.
   */
  description: string | null;
}

/**
 * Request payload for `POST /laboratories/{laboratoryId}/environments/{environmentId}/usage-assignments`.
 */
export interface AssignEnvironmentUsageRequest {
  /**
   * Usage to assign to the environment.
   */
  usage: EnvironmentUsage;
}
