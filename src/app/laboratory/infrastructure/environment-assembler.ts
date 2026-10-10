import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Environment } from '../domain/model/environment.entity';
import { EnvironmentResource, EnvironmentsResponse } from './environment-response';

/**
 * Assembler for converting between Environment domain entities and API resources.
 *
 * @remarks
 * Optional fields missing from the backend resource are normalized to `null`.
 */
export class EnvironmentAssembler implements BaseAssembler<
  Environment,
  EnvironmentResource,
  EnvironmentsResponse
> {
  /**
   * Converts an environment collection envelope into domain entities.
   *
   * @param response - API response containing environment resources
   * @returns Array of Environment domain entities
   */
  toEntitiesFromResponse(response: EnvironmentsResponse): Environment[] {
    return response.environments.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an environment API resource into a domain entity.
   *
   * @param resource - Environment resource received from the API
   * @returns Environment domain entity
   */
  toEntityFromResource(resource: EnvironmentResource): Environment {
    return new Environment({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      code: resource.code,
      name: resource.name,
      description: resource.description ?? null,
      usage: resource.usage ?? null,
      usageAssignedBy: resource.usageAssignedBy ?? null,
      usageAssignedAt: resource.usageAssignedAt ?? null,
    });
  }

  /**
   * Converts an Environment domain entity into an API resource.
   *
   * @param entity - Environment domain entity
   * @returns Environment resource
   */
  toResourceFromEntity(entity: Environment): EnvironmentResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      usage: entity.usage,
      usageAssignedBy: entity.usageAssignedBy,
      usageAssignedAt: entity.usageAssignedAt,
    };
  }
}
