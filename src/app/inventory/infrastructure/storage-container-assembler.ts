import { StorageContainer } from '../domain/model/storage-container.entity';
import { StorageContainerResource } from './storage-container-response';

/**
 * Translates the container monitors of Equipment Management into the containers where lots are stored.
 */
export class StorageContainerAssembler {
  toEntityFromResource(resource: StorageContainerResource): StorageContainer {
    return new StorageContainer({
      id: resource.id,
      name: resource.name,
      serialNumber: resource.serialNumber,
      status: resource.status,
      environmentId: resource.environmentId,
    });
  }
}
