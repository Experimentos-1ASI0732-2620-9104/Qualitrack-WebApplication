import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EquipmentStore } from '../../../application/equipment.store';
import { EdgeGatewayForm } from './edge-gateway-form';

describe('EdgeGatewayForm', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [EdgeGatewayForm],
      providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    vi.spyOn(TestBed.inject(EquipmentStore), 'loadEnvironments').mockResolvedValue(undefined as never);
    const fixture = TestBed.createComponent(EdgeGatewayForm);
    fixture.detectChanges();
    return (fixture.componentInstance as unknown as { form: import('@angular/forms').FormGroup }).form;
  }

  const valid = {
    name: 'Edge Gateway almacén',
    sensorExternalId: 'EDGE-001',
    serialNumber: 'RPI-0001',
    model: 'Raspberry Pi 4',
    environmentId: null,
  };

  it('accepts valid data, with the environment optional', () => {
    const form = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
    form.setValue({ ...valid, environmentId: 3 });
    expect(form.valid).toBe(true);
  });

  it('proposes the Raspberry Pi 4 as the model', () => {
    expect(create().get('model')?.value).toBe('Raspberry Pi 4');
  });

  it.each([
    ['name', '   ', 'notBlank'],
    ['name', 'ab', 'minlength'],
    ['sensorExternalId', '', 'required'],
    ['sensorExternalId', 'EDGE 001', 'code'],
    ['serialNumber', 'RPI#1', 'code'],
    ['model', '   ', 'notBlank'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const form = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });
});
