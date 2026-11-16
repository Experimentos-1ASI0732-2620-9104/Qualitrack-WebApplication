import { MonitoredEnvironment } from '../domain/model/monitored-environment.entity';
import { MonitoredEnvironmentResource } from './monitored-environment-response';

/**
 * Translates the environments of Laboratory Management into the environments of Tracking & Telemetry.
 */
export class MonitoredEnvironmentAssembler {
  toEntityFromResource(resource: MonitoredEnvironmentResource): MonitoredEnvironment {
    return new MonitoredEnvironment({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      usage: resource.usage ?? null,
    });
  }
}
