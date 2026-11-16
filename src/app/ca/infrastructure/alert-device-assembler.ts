import { AlertDevice } from '../domain/model/alert-device.entity';
import { AlertDeviceResource } from './alert-device-response';

/**
 * Translates the equipment of Equipment Management into the devices where alerts originate.
 */
export class AlertDeviceAssembler {
  toEntityFromResource(resource: AlertDeviceResource): AlertDevice {
    return new AlertDevice({ id: resource.id, name: resource.name });
  }
}
