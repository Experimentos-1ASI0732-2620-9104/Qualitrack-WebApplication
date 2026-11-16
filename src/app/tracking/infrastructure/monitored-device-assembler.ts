import { MonitoredDevice, MonitoredDeviceType } from '../domain/model/monitored-device.entity';
import { MonitoredDeviceResource } from './monitored-device-response';

/** Device types that report readings to Tracking & Telemetry. */
const DEVICE_TYPES: readonly string[] = ['ENVIRONMENTAL_DEVICE', 'CONTAINER_MONITOR'];

/**
 * Anti-Corruption Layer Equipment → Tracking: translates the equipment of Equipment Management into the devices that
 * Tracking & Telemetry follows.
 */
export class MonitoredDeviceAssembler {
  /**
   * Whether an equipment is an IoT device that Tracking & Telemetry follows.
   *
   * @param resource - Equipment returned by Equipment Management
   */
  isMonitored(resource: MonitoredDeviceResource): boolean {
    return resource.deviceType !== null && DEVICE_TYPES.includes(resource.deviceType);
  }

  /**
   * Translates an IoT device; call it only for resources that {@link isMonitored} accepts.
   *
   * @param resource - Equipment returned by Equipment Management
   */
  toEntityFromResource(resource: MonitoredDeviceResource): MonitoredDevice {
    return new MonitoredDevice({
      id: resource.id,
      name: resource.name,
      deviceType: resource.deviceType as MonitoredDeviceType,
      environmentId: resource.environmentId,
    });
  }
}
