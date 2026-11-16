import { AlertEnvironment } from '../domain/model/alert-environment.entity';
import { AlertEnvironmentResource } from './alert-environment-response';

/**
 * Translates the environments of Laboratory Management into the environments of Compliance & Alerts.
 */
export class AlertEnvironmentAssembler {
  toEntityFromResource(resource: AlertEnvironmentResource): AlertEnvironment {
    return new AlertEnvironment({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      usage: resource.usage ?? null,
    });
  }
}
