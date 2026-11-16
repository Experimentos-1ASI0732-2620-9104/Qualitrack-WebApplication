import { StorageEnvironment } from '../domain/model/storage-environment.entity';
import { StorageEnvironmentResource } from './storage-environment-response';

/**
 * Translates the environments of Laboratory Management into the environments of Inventory Management.
 */
export class StorageEnvironmentAssembler {
  toEntityFromResource(resource: StorageEnvironmentResource): StorageEnvironment {
    return new StorageEnvironment({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      usage: resource.usage ?? null,
    });
  }
}
