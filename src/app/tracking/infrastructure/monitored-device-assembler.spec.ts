import { MonitoredDeviceAssembler } from './monitored-device-assembler';
import { MonitoredDeviceResource } from './monitored-device-response';

describe('MonitoredDeviceAssembler', () => {
  const assembler = new MonitoredDeviceAssembler();
  const equipment = (deviceType: string | null): MonitoredDeviceResource => ({
    id: 3, laboratoryId: 1, environmentId: 1, name: 'Contenedor MP-A1', deviceType,
  });

  it('follows only environmental devices and container monitors', () => {
    expect(assembler.isMonitored(equipment('ENVIRONMENTAL_DEVICE'))).toBe(true);
    expect(assembler.isMonitored(equipment('CONTAINER_MONITOR'))).toBe(true);
    expect(assembler.isMonitored(equipment(null))).toBe(false);
    expect(assembler.isMonitored(equipment('PRINTER'))).toBe(false);
  });

  it('translates the equipment into a device of Tracking', () => {
    const device = assembler.toEntityFromResource(equipment('CONTAINER_MONITOR'));

    expect(device.id).toBe(3);
    expect(device.name).toBe('Contenedor MP-A1');
    expect(device.environmentId).toBe(1);
    expect(device.isContainerMonitor).toBe(true);
  });
});
