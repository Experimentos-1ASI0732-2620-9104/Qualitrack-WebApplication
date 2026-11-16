import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EquipmentStore } from '../../../application/equipment.store';
import { EdgeGatewayCoverage } from '../../../domain/model/edge-gateway-coverage.entity';
import { Equipment } from '../../../domain/model/equipment.entity';
import { EnvironmentEquipment } from './environment-equipment';

describe('EnvironmentEquipment', () => {
  const located = [
    new Equipment({
      id: 3,
      labId: 42,
      environmentId: 1,
      name: 'Contenedor MP-A1',
      type: 'IOT_DEVICE',
      model: 'ESP32-S3',
      serialNumber: 'SN-CTN-24011',
      status: 'OPERATIONAL',
      deviceType: 'CONTAINER_MONITOR',
      sensorExternalId: 'ESP32-CTN-MPA1',
      firmwareVersion: null,
      createdAt: '2026-10-01T10:00:00Z',
    }),
    new Equipment({
      id: 4,
      labId: 42,
      environmentId: 1,
      name: 'Autoclave AV-200',
      type: 'Autoclave',
      model: '3870EL',
      serialNumber: 'TT-3870-1182',
      status: 'OPERATIONAL',
      deviceType: null,
      sensorExternalId: null,
      firmwareVersion: null,
      createdAt: '2026-10-01T10:00:00Z',
    }),
  ];

  /** Opens the view of environment 1 with the given answers for its equipment and its coverage. */
  async function open(equipment: Promise<Equipment[]>, coverage: Promise<EdgeGatewayCoverage>) {
    TestBed.configureTestingModule({
      imports: [EnvironmentEquipment],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ environmentId: '1' }) } } },
      ],
    });
    const store = TestBed.inject(EquipmentStore);
    vi.spyOn(store, 'loadEnvironments').mockResolvedValue(undefined);
    vi.spyOn(store, 'loadEnvironmentEquipment').mockReturnValue(equipment);
    vi.spyOn(store, 'loadEdgeGatewayCoverage').mockReturnValue(coverage);
    const fixture = TestBed.createComponent(EnvironmentEquipment);
    fixture.detectChanges();
    // Lets both requests settle before looking at the page.
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const coverage = new EdgeGatewayCoverage({
    maxDevicesPerGateway: 15,
    deviceCount: 1,
    uncoveredDeviceCount: 1,
    gateways: [],
  });

  it('shows the coverage, the devices and the equipment of the environment', async () => {
    const element = await open(Promise.resolve(located), Promise.resolve(coverage));

    expect(element.textContent).toContain('environment-equipment.uncovered-warning');
    expect(element.textContent).toContain('Contenedor MP-A1');
    expect(element.textContent).toContain('Autoclave AV-200');
    expect(element.textContent).not.toContain('environment-equipment.coverage-error');
  });

  it('still lists the devices and the equipment when only the coverage fails', async () => {
    const element = await open(Promise.resolve(located), Promise.reject(new Error('404')));

    expect(element.textContent).toContain('environment-equipment.coverage-error');
    expect(element.textContent).toContain('Contenedor MP-A1');
    expect(element.textContent).toContain('Autoclave AV-200');
    expect(element.textContent).not.toContain('environment-equipment.uncovered-warning');
  });

  it('shows only the error when the equipment of the environment cannot be read', async () => {
    const element = await open(Promise.reject(new Error('500')), Promise.resolve(coverage));

    expect(element.querySelector('.error[role="alert"]')).not.toBeNull();
    expect(element.textContent).not.toContain('Contenedor MP-A1');
    expect(element.querySelector('table')).toBeNull();
  });
});
