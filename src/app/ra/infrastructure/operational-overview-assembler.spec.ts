import { OperationalOverviewAssembler } from './operational-overview-assembler';

describe('OperationalOverviewAssembler', () => {
  const assembler = new OperationalOverviewAssembler();

  it('keeps the path of a batch only when it has an environment', () => {
    const located = assembler.toBatch({
      id: 7, environmentId: 3, productId: 2, productName: 'Paracetamol', batchNumber: 'PAR-01', status: 'IN_PROGRESS',
    });
    const legacy = assembler.toBatch({
      id: 8, environmentId: null, productId: 2, productName: 'Paracetamol', batchNumber: 'PAR-02', status: 'PENDING',
    });

    expect(located.detailLink).toEqual(['/batches/environments', 3, 'products', 2, 'batches', 7]);
    expect(legacy.detailLink).toBeNull();
  });

  it('keeps the code, name and usage of an environment', () => {
    const environment = assembler.toEnvironment({ id: 3, code: 'PROD-SOL-01', name: 'Sólidos', usage: null });

    expect(environment).toMatchObject({ id: 3, code: 'PROD-SOL-01', name: 'Sólidos', usage: null });
  });

  it('tells IoT devices and container monitors from process equipment', () => {
    const monitor = assembler.toEquipment({ id: 1, laboratoryId: 1, environmentId: 1, name: 'MP-A1', deviceType: 'CONTAINER_MONITOR' });
    const mixer = assembler.toEquipment({ id: 2, laboratoryId: 1, environmentId: 3, name: 'Mixer', deviceType: null });

    expect(monitor.isIotDevice).toBe(true);
    expect(monitor.isContainerMonitor).toBe(true);
    expect(mixer.isIotDevice).toBe(false);
  });

  it('charts only finite readings of variables other than motion', () => {
    const reading = (metric: string, value: number | null) =>
      assembler.toReading({ deviceId: 1, metric, value, unit: 'ppm', measuredAt: '2026-10-11T00:00:00Z' });

    expect(reading('AIR_QUALITY', 461).isChartable).toBe(true);
    expect(reading('AIR_QUALITY', null).isChartable).toBe(false);
    expect(reading('MOTION', 1).isChartable).toBe(false);
  });

  it('translates the amount and billing cycle of a plan', () => {
    const plan = assembler.toPlan({
      code: 'BASIC', name: 'Standard Lab', amount: 199, currency: 'USD', billingCycle: 'MONTHLY', maxEquipment: 5,
    });

    expect(plan.priceAmount).toBe(199);
    expect(plan.billingPeriod).toBe('MONTHLY');
  });

  it('marks low stock and open alerts', () => {
    expect(assembler.toRawMaterial({ id: 1, name: 'Agua', stockStatus: 'LOW' }).isLowStock).toBe(true);
    const alert = (status: string) => assembler.toAlert({
      id: 1, equipmentId: 1, parameterName: 'AIR_QUALITY', recordedValue: 951, unit: 'ppm', severity: 'CRITICAL', status,
      timestamp: '2026-10-04T22:01:00Z',
    });

    expect(alert('ACKNOWLEDGED').isOpen).toBe(true);
    expect(alert('RESOLVED').isOpen).toBe(false);
  });
});
