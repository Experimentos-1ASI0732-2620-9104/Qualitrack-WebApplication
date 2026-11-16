import { InstallationEnvironment } from '../domain/model/installation-environment.entity';
import { InstallationEnvironmentResource } from './installation-environment-response';

/**
 * Translates the environments of Laboratory Management into the environments of Equipment Management.
 */
export class InstallationEnvironmentAssembler {
  toEntityFromResource(resource: InstallationEnvironmentResource): InstallationEnvironment {
    return new InstallationEnvironment({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      usage: resource.usage ?? null,
    });
  }
}
