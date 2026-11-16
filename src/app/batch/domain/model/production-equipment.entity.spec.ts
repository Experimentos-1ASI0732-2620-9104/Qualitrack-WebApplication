import { ProductionEquipment } from './production-equipment.entity';

describe('ProductionEquipment', () => {
  const equipment = (deviceType: string | null, status = 'OPERATIONAL') =>
    new ProductionEquipment({ id: 1, name: 'Mezcladora MZ-50', serialNumber: 'MZ-50-01', status, deviceType, environmentId: 3 });

  it('tells process equipment from IoT devices', () => {
    expect(equipment(null).isIotDevice).toBe(false);
    expect(equipment('CONTAINER_MONITOR').isIotDevice).toBe(true);
    expect(equipment('CONTAINER_MONITOR').isContainerMonitor).toBe(true);
    expect(equipment('ENVIRONMENTAL_DEVICE').isContainerMonitor).toBe(false);
  });

  it('is usable only while it is operational', () => {
    expect(equipment(null).isOperational).toBe(true);
    expect(equipment(null, 'MAINTENANCE').isOperational).toBe(false);
  });
});
