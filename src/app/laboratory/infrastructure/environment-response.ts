import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { EnvironmentUsage } from '../domain/model/environment-usage';

/**
 * Resource representation of an environment returned by the backend.
 *
 * @remarks
 * Mirrors `EnvironmentResource` of
 * `GET /api/v1/laboratories/{laboratoryId}/environments`.
 */
export interface EnvironmentResource extends BaseResource {
  /**
   * The unique numeric identifier of the environment.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns the environment.
   */
  laboratoryId: number;

  /**
   * Identification of the environment, unique within its laboratory.
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

  /**
   * Main use of the environment, or `null` while it has not been assigned.
   */
  usage: EnvironmentUsage | null;

  /**
   * Identifier of the user that assigned the current usage.
   */
  usageAssignedBy: number | null;

  /**
   * ISO 8601 timestamp of the current usage assignment.
   */
  usageAssignedAt: string | null;
}

/**
 * Resource returned when a usage is assigned to an environment.
 *
 * @remarks
 * Mirrors `EnvironmentUsageAssignmentResource` of
 * `POST /api/v1/laboratories/{laboratoryId}/environments/{environmentId}/usage-assignments`.
 */
export interface EnvironmentUsageAssignmentResource {
  /**
   * The numeric identifier of the environment.
   */
  environmentId: number;

  /**
   * The numeric identifier of the laboratory that owns the environment.
   */
  laboratoryId: number;

  /**
   * Usage assigned to the environment.
   */
  usage: EnvironmentUsage;

  /**
   * Identifier of the user that assigned the usage, if known.
   */
  assignedBy: number | null;

  /**
   * ISO 8601 timestamp of the assignment.
   */
  assignedAt: string;
}

/**
 * Response envelope for environment collections.
 */
export interface EnvironmentsResponse extends BaseResponse {
  /**
   * Array of environment resources returned by the API.
   */
  environments: EnvironmentResource[];
}
