import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EquipmentStore } from '../../../application/equipment.store';
import { DeviceForm } from './device-form';

describe('DeviceForm', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [DeviceForm],
      providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    vi.spyOn(TestBed.inject(EquipmentStore), 'loadEquipment').mockImplementation(() => undefined as never);
    vi.spyOn(TestBed.inject(EquipmentStore), 'loadEnvironments').mockResolvedValue(undefined as never);
    const fixture = TestBed.createComponent(DeviceForm);
    fixture.detectChanges();
    return (fixture.componentInstance as unknown as { form: import('@angular/forms').FormGroup }).form;
  }

  const valid = {
    deviceType: 'ENVIRONMENTAL_DEVICE',
    name: 'Sensor cámara fría',
    sensorExternalId: 'ESP32-A1',
    serialNumber: 'SN-0001',
    model: 'ESP32',
    firmwareVersion: '1.2.3',
    environmentId: null,
  };

  it('accepts valid data, with the firmware optional', () => {
    const form = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
    form.setValue({ ...valid, firmwareVersion: null });
    expect(form.valid).toBe(true);
  });

  it.each([
    ['name', '   ', 'notBlank'],
    ['sensorExternalId', '   ', 'notBlank'],
    ['sensorExternalId', 'ESP 32', 'code'],
    ['serialNumber', 'SN#1', 'code'],
    ['model', '   ', 'notBlank'],
    ['firmwareVersion', 'abc', 'pattern'],
    ['firmwareVersion', '1', 'pattern'],
    ['firmwareVersion', '1.2.3.4.5', 'pattern'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const form = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });

  it.each(['1.2', 'v1.2.3', '2.0.1-beta.1', '1.0.0+build5'])('accepts the firmware %s', version => {
    const form = create();
    form.setValue({ ...valid, firmwareVersion: version });
    expect(form.get('firmwareVersion')?.valid).toBe(true);
  });
});
